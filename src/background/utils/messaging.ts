import {ExtensionData, Message, TabInfo} from '../../definitions';

type messageListenerResponse = {data?: ExtensionData | TabInfo; error?: string} | 'unsupportedSender';
type messageListenerCallback = (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: messageListenerResponse) => void) => void;

export default class RuntimeMesseageListener {
    static listeners: Array<messageListenerCallback>;
    static addListener(callback: messageListenerCallback) {
        if (!this.listeners) {
            this.listeners = [callback];
            chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => this.singleListener(message, sender, sendResponse));
        } else {
            this.listeners.push(callback);
        }
    }
    private static singleListener(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: messageListenerResponse) => void) {
        this.listeners.forEach((listener) => listener(message, sender, (response: messageListenerResponse) => {
            sendResponse(response);
        }));
        return true;
    }
}