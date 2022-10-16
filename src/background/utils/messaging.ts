import type {ExtensionData, Message, TabInfo} from '../../definitions';

type messageListenerResponse = {data?: ExtensionData | TabInfo; error?: string} | 'unsupportedSender';
// Note: return value should be only true or falsy
type messageListenerCallback = (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: messageListenerResponse) => void) => true | void | Promise<void>;

export default class RuntimeMesseageListener {
    static listeners: messageListenerCallback[];

    static addListener(callback: messageListenerCallback) {
        if (!this.listeners) {
            this.listeners = [callback];
            chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => this.singleListener(message, sender, sendResponse));
        } else {
            this.listeners.push(callback);
        }
    }

    private static singleListener(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: messageListenerResponse) => void) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i](message, sender, sendResponse) === true) {
                return true;
            }
        }
        return false;
    }
}
