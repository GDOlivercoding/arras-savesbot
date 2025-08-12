const nameToLink = {
    NumberOperation: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402766407304872008",
    BuildExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402768168258244760",
    DateOperation: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402766854807752815",
    GamemodeExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1404176405876445345",
    CodePartExpression: "https://discord.com/channels/1395076754816761956/1402655824530247712/1402769566186340465"
};

const handler: ProxyHandler<typeof nameToLink> = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_target, prop, _receiver) {
        if (typeof prop == "symbol") throw Error(`Internal: Special proxy indexed by symbol '${String(prop)}'`);
        if (!(prop in nameToLink)) throw Error(`Internal: Invalid link key '${prop}'.`)
        const cast = prop as keyof typeof nameToLink
        if (nameToLink[cast] == "MISSING") throw Error(`Internal: Key '${prop}' has not been implemented.`)

        return `[**${prop}**](${nameToLink[cast]})`
        
    },
}

export default new Proxy({} as typeof nameToLink, handler)