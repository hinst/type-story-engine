import { StoryElement } from "./storyElement";
import { StoryState } from "./storyState";

export class StoryScene {
    state: StoryState;
    sceneMap: StorySceneMap;

    /** Modify state. This method is meant to be optionally overridden in descendants */
    advance() {
    }

    /** Present scene's content for the user. This method is meant to be always overridden in descendants. */
    render(): StoryElement[] {
        return ['The scene lacks render() method.'];
    }

    /** Receive command from the user. This method is meant to be always overridden in descendants,
        except for those scenes that present a dead-end (game over, the last scene with no further scenes) */
    receiveCommand(command: string): StorySceneConstructor {
        return null;
    }
}

export type StorySceneConstructor = { new(): StoryScene };
export type StorySceneMap = { [className: string]: StorySceneConstructor }

export function buildStorySceneMap(namespaces: any[]) {
    const map: StorySceneMap = {};
    for (const space of namespaces) {
        for (const identifierName in space) {
            const identifier = space[identifierName];
            if (typeof identifier == 'function' && (new identifier) instanceof StoryScene)
                map[identifierName] = identifier;
        }
    }
    return map;
}