import sdk, { AudioConfig, AudioInputStream, PushAudioInputStream, SpeechConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import EventEmitter from "node:events";
import { exit } from "node:process";

/*
export interface SpeechEvent {
    readonly text: string;
};

export abstract class UtteranceEvent implements SpeechEvent {
    public readonly text: string;
    constructor (text: string) {
        this.text = text;
    }
}

export class CompleteUtteranceEvent extends UtteranceEvent {
    text: string;
}
*/

export type UtteranceHandler = (speech: string) => void;


export interface SpeechToText {
    create(onCompleteUtterance?: UtteranceHandler, onPartialUtterance?: UtteranceHandler): SpeechToText;
    onPartialUtterance?: UtteranceHandler;
    onCompleteUtterance?: UtteranceHandler;
    write(content: ArrayBuffer): void;
    listen(): void;
    close(): void;
};

export class AzureSpeechToText implements SpeechToText {

    private static speechConfig: SpeechConfig;

    static {
        try {
            this.speechConfig = sdk.SpeechConfig.fromSubscription("YourSpeechKey", "YourSpeechRegion"); 
        } catch {
            console.error("Azure configuration error");
            exit(1);
        }
    }

    private readonly audioStream: PushAudioInputStream;
    private readonly audioConfig: AudioConfig;
    private readonly recognizer: SpeechRecognizer;

    public onPartialUtterance?: UtteranceHandler;
    public onCompleteUtterance?: UtteranceHandler;

    public readonly utterance: EventEmitter = new EventEmitter();

    public create(onCompleteUtterance?: UtteranceHandler, onPartialUtterance?: UtteranceHandler): SpeechToText {
        const azureSTT = new AzureSpeechToText();
        if (onCompleteUtterance) azureSTT.onCompleteUtterance = onCompleteUtterance;
        if (onPartialUtterance) azureSTT.onPartialUtterance = onPartialUtterance;
        return azureSTT;
    }

    private constructor() {
        this.audioStream = sdk.PushAudioInputStream.create();
        this.audioConfig = sdk.AudioConfig.fromStreamInput(this.audioStream)
        this.recognizer = new sdk.SpeechRecognizer(AzureSpeechToText.speechConfig, this.audioConfig);

        this.recognizer.recognizing = (s, e) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
            if (typeof this.onPartialUtterance === "function") {
                this.onPartialUtterance(e.result.text);
            }
        };

        this.recognizer.recognized = (s, e) => {
            if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
                console.log(`RECOGNIZED: Text=${e.result.text}`);
                if (this.onCompleteUtterance) {
                    this.onCompleteUtterance(e.result.text);
                }
            }
            else if (e.result.reason == sdk.ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
                if (this.onCompleteUtterance) {
                    this.onCompleteUtterance("");
                }
            }
        };

        this.recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);

            if (e.reason == sdk.CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you set the speech resource key and region values?");
            }

            this.recognizer.stopContinuousRecognitionAsync();
        };

        this.recognizer.sessionStopped = (s, e) => {
            console.log("\n    Session stopped event.");
            this.recognizer.stopContinuousRecognitionAsync();
        };
    }

    public listen() {
        this.recognizer.startContinuousRecognitionAsync();
    }

    public close() {
        this.recognizer.stopContinuousRecognitionAsync();
    }

    public write(content: ArrayBuffer) {
        this.audioStream.write(content);
    }
}
