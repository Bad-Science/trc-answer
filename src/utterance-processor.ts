export type UtteranceHandler = (speech: string) => string|null;

const loggingUtteranceHandler: UtteranceHandler = (speech: string) => {
    console.log(speech);
    return null;
};

const voidUtteranceHandler: UtteranceHandler = () => { return null };

export interface UtteranceProcessor {
    onCompleteUtterance: UtteranceHandler;
    onPartialUtterance: UtteranceHandler;
}

export class VoidUtteranceProcessor implements UtteranceProcessor {
    onCompleteUtterance: UtteranceHandler = voidUtteranceHandler;
    onPartialUtterance: UtteranceHandler = voidUtteranceHandler;
}

export class LoggingUtteranceProcessor implements UtteranceProcessor {
    onCompleteUtterance: UtteranceHandler = loggingUtteranceHandler;
    onPartialUtterance: UtteranceHandler = loggingUtteranceHandler;
}

export class AnsweringMachineUtternaceProcessor extends LoggingUtteranceProcessor {
    onCompleteUtterance: UtteranceHandler = (speech: string) {

    }
    onPartialUtterance: UtteranceHandler = loggingUtteranceHandler;
};
