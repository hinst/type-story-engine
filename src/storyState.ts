import { StoryError } from "./StoryError";

export class StoryState {
    sceneClassName: string;
    statusSceneClassName: string;
    returningSceneName: string;

    validate() {
        if (this.sceneClassName == null || this.sceneClassName.length == 0)
            throw new StoryError('Story state must contain sceneClassName.')
    }
}

export type StoryStateConstructor = { new(): StoryState };