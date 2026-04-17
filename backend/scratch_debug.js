const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const firstFile = await prisma.file.findFirst({ where: { isDeleted: false } });
        console.log("File found:", firstFile ? firstFile.id : "None");
        
        if (firstFile) {
            const firstWorkspace = await prisma.workspace.findFirst();
            if (firstWorkspace) {
               console.log("Workspace found:", firstWorkspace.id);
               const result = await prisma.file.update({
                   where: { id: firstFile.id },
                   data: { workspaceId: firstWorkspace.id }
               });
               console.log("Update success!", result.id);
            } else {
               console.log("No workspace found, trying null update");
               const result = await prisma.file.update({
                   where: { id: firstFile.id },
                   data: { workspaceId: null }
               });
               console.log("Update success!", result.id);
            }
        }
    } catch (e) {
        console.error("Prisma error:", e.message);
    }
}
test();
