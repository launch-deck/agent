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
                    owner: 'nova706',
                    name: 'launch-deck'
                },
                draft: true
            }
        }
    ],
};
