const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    console.log("🛠️ [Repair] Starting Neural Schema Repair...");
    try {
        // 1. Ensure at least one Organization exists
        let orgs = await prisma.organization.findMany();
        let mainOrg;

        if (orgs.length === 0) {
            console.log("🛠️ [Repair] No organizations found. Creating default...");
            mainOrg = await prisma.organization.create({
                data: { name: 'Nalyse Enterprise', slug: 'nalyse' }
            });
        } else {
            mainOrg = orgs[0];
            console.log(`🛠️ [Repair] Found existing organization: ${mainOrg.name} (${mainOrg.id})`);
        }

        const orgId = mainOrg.id;

        // 2. Ensure default Roles exist for this organization
        const defaultRoles = [
            { name: 'Super Admin', permissions: ['*:*', 'datasets:read', 'users:manage'] },
            { name: 'Data Engineer', permissions: ['datasets:read', 'datasets:write', 'pipelines:manage'] },
            { name: 'Analyst', permissions: ['datasets:read', 'dashboards:read', 'reports:create'] },
            { name: 'Viewer', permissions: ['dashboards:read', 'reports:read'] }
        ];

        for (const roleDef of defaultRoles) {
            await prisma.orgRole.upsert({
                where: { organizationId_name: { organizationId: orgId, name: roleDef.name } },
                update: { permissions: roleDef.permissions },
                create: { 
                    name: roleDef.name, 
                    permissions: roleDef.permissions, 
                    organizationId: orgId 
                }
            });
        }
        console.log("🛠️ [Repair] Default roles verified.");

        // 3. Re-align all orphan users and workspaces
        console.log("🛠️ [Repair] Aligning users to primary organization...");
        await prisma.user.updateMany({
            where: { organizationId: { not: orgId } },
            data: { organizationId: orgId }
        });
        
        // Also handle nulls
        await prisma.user.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });

        console.log("🛠️ [Repair] Aligning workspaces to primary organization...");
        await prisma.workspace.updateMany({
            where: { organizationId: { not: orgId } },
            data: { organizationId: orgId }
        });

        // 4. Assign Roles to users if they don't have one
        const superAdminRole = await prisma.orgRole.findFirst({ where: { organizationId: orgId, name: 'Super Admin' } });
        const userRole = await prisma.orgRole.findFirst({ where: { organizationId: orgId, name: 'Viewer' } });

        const users = await prisma.user.findMany({ where: { orgRoleId: null } });
        for (const user of users) {
           const roleToAssign = (user.role === 'admin') ? superAdminRole.id : userRole.id;
           await prisma.user.update({
               where: { id: user.id },
               data: { orgRoleId: roleToAssign }
           });
        }

        console.log("✅ [Repair] Neural Schema Repair completed successfully.");
    } catch (err) {
        console.error("❌ [Repair] Error during repair:", err);
    } finally {
        await prisma.$disconnect();
    }
}

repair();
