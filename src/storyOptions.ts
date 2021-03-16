import { StoryError } from "./StoryError";
import { StorySceneMap } from "./storyScene";
import { StoryStateConstructor } from "./storyState";

export class StoryOptions {
    appPrefix: string;
    sceneMap: StorySceneMap;
    stateConstructor: StoryStateConstructor;

    validate() {
        if (!this.sceneMap)
            throw new StoryError('Need options.sceneMap');
        if (!this.appPrefix)
            throw new StoryError('Need options.appPrefix');
        if (!this.stateConstructor)
            throw new StoryError('Need state constructor');
    }
}

