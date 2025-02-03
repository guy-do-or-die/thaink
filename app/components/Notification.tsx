import { Toaster, toast } from "react-hot-toast"
import { CopyToClipboard } from 'react-copy-to-clipboard'


export const Copy = ({ content, toCopy, onCopy: onCopyCallback }) => {

    const onCopy = () => {
        notify(`Copied to clipboard`, 'success', { duration: 1000 })
        onCopyCallback?.()
    }

    return (
        <CopyToClipboard text={toCopy || content} onCopy={onCopy}>
            <div className="cursor-pointer">{content}</div>
        </CopyToClipboard>
    )
}


export const parseError = (error) => {

    const templates = [
        /(The total cost (.+?) exceeds the balance of the account)/,
        /(Execution reverted for an unknown reason)/,
        /(The contract function (.+?) reverted)/,
        /(User rejected the request)/,
        /following reason:\n(.*?)\n/s,
        /(RPC Error)/,
    ]

    let msg

    if (error) {
        console.log(error)
        msg = error.message

        templates.some(template => {
            const matches = msg.match(template)

            if (matches && matches[1]) {
                msg = matches[1].trim()
                return true
            }
        })
    }

    return msg
}


export const notify = (content: string, typ: string, params: object) => {
    const defaultParams = {
        "error": {
            duration: 5000,
        },
        "success": {
            duration: 3000,
        }
    }[typ] || {}

    if (content) {
        const contentEl = typ === 'error' ? <Copy content={content} /> : content

        return (toast[typ] || toast)(contentEl, { ...defaultParams, ...params })
    }
}


export const hide = (id: string) => {
    toast.dismiss(id)
}


export const Notification = ({ }) => {
    return <>
        <Toaster toastOptions={{}} />
    </>
}