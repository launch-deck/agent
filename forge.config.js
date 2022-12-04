module.exports = {
    packagerConfig: {
        ignore: [
            "^/[.]github$",
            "^/app$",
            "^/out$",
            "^/scratch$",
            "^/src$",
            "^/[.]gitignore$",
            "^/tsconfig[.]json$"
        ]
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'launch-deck',
                    name: 'agent'
                },
                draft: true
            }
        }
    ],
};
