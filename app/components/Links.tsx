import { thainkAddress } from '@/contracts'
import { chain } from '@/wallet'

import xUrl from '/assets/icons/x.png'
import telegramUrl from '/assets/icons/telegram.png'
import discordUrl from '/assets/icons/discord.png'
import farcasterUrl from '/assets/icons/farcaster.png'
import guildUrl from '/assets/icons/guild.png'
import gitUrl from '/assets/icons/git.png'
import openseaUrl from '/assets/icons/opensea.png'
import etherscanUrl from '/assets/icons/etherscan.png'


function Link({ href, icon, title }) {
    return <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 transition flex-shrink-0">
        <img src={icon} alt={title} title={title} className="w-6 h-6 min-w-[24px] hover:opacity-75 transition" />
    </a>
}


export default function Links() {
    const explorer = chain.blockExplorers?.default.url
    const contractAddress = thainkAddress[chain.id]

    return <div className="links flex justify-center items-start">
        <div className="flex flex-wrap gap-x-2 md:gap-4 filter grayscale">
            <Link title="Farcaster" href="https://warpcast.com/~/channel/thaink" icon={farcasterUrl} />
            <Link title="Telegram" href="https://t.me/thaink_in" icon={telegramUrl} />
            <Link title="Discord" href="https://discord.gg/VkkCtT8Eeh" icon={discordUrl} />
            <Link title="Guild" href="https://guild.xyz/thaink" icon={guildUrl} />
            <Link title="X" href="http://x.com/thaink_in" icon={xUrl} />
            {chain ? <Link title="Opensea" href={`https://${chain.testnet ? 'testnets.' : ''}opensea.io/assets/${chain.network}/${contractAddress}`} icon={openseaUrl} /> : ""}
            {chain ? <Link title="Contract" href={`${explorer}/address/${contractAddress}#code`} icon={etherscanUrl} /> : ""}
            <Link title="Code" href="https://github.com/guy-do-or-die/thaink" icon={gitUrl} />
        </div>
    </div>
}