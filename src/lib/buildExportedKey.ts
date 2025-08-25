export function buildExportedKey(projectName: string, groupName: string, entryKey: string) {
    const raw = `${projectName}_${groupName}_${entryKey}`
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '_')
}
