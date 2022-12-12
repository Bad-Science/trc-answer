import sdk, { AudioConfig, AudioInputStream, PushAudioInputStream, SpeechConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import { exit } from "node:process";
import { UtteranceProcessor } from "./utterance-processor";

export interface SpeechToText {
    readonly processor: UtteranceProcessor;
    write(content: ArrayBuffer): void;
    listen(): void;
    close(): void;
};

export interface SpeechToTextProvider {
    create(processor: UtteranceProcessor): SpeechToText;
}

export class AzureSpeechToTextProvider {
    private readonly speechConfig: SpeechConfig;

    constructor(key: string, region: string) {
        try {
            this.speechConfig = sdk.SpeechConfig.fromSubscription(key, region); 
        } catch {
            console.error("Azure configuration error");
            exit(1);
        }
    }

    public create(processor: UtteranceProcessor): SpeechToText {
        return new AzureSpeechToText(processor, this.speechConfig);
    }
}

class AzureSpeechToText implements SpeechToText {
    public readonly processor: UtteranceProcessor;
    private readonly speechConfig: SpeechConfig;
    private readonly audioStream: PushAudioInputStream;
    private readonly audioConfig: AudioConfig;
    private readonly recognizer: SpeechRecognizer;

    public constructor(processor: UtteranceProcessor, speechConfig: SpeechConfig) {
        this.processor = processor;
        this.speechConfig = speechConfig;
        this.audioStream = sdk.PushAudioInputStream.create();
        this.audioConfig = sdk.AudioConfig.fromStreamInput(this.audioStream)
        this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, this.audioConfig);

        this.recognizer.recognizing = (s, e) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
            this.processor.onPartialUtterance(e.result.text);
        };

        this.recognizer.recognized = (s, e) => {
            if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
                console.log(`RECOGNIZED: Text=${e.result.text}`);
                this.processor.onCompleteUtterance(e.result.text);
            }
            else if (e.result.reason == sdk.ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
                this.processor.onCompleteUtterance("");
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
