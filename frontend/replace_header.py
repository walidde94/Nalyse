import os

target_path = "src/components/layout/Header.tsx"
with open(target_path, "r") as f:
    lines = f.readlines()

new_content = open("new_header_right.tsx", "r").read()

# Find the start index for replacement
start_idx = -1
for i, line in enumerate(lines):
    if "div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}" in line and "Right Side" in lines[i-1]:
        start_idx = i - 1
        break

if start_idx == -1:
    print("Could not find start index")
    exit(1)

# Find the end of the return block to slice out the old bottom
end_idx = len(lines)

new_lines = lines[:start_idx] + [new_content]

with open(target_path, "w") as f:
    f.write("".join(new_lines))

print("Successfully updated Header.tsx!")
