import { StoryError, StorySceneNotFoundError } from "./StoryError";
import { StoryOptions } from "./storyOptions";
import { StoryScene, StorySceneConstructor } from "./storyScene";
import { StoryState } from "./storyState";

export class StoryRunner {
    options: StoryOptions;
    static readonly AUTOSAVE_FILENAME = 'auto-save';

    constructor(options: StoryOptions) {
        options.validate();
        this.options = options;
    }

    async run() {
        await this.runInner();
    }

    async runInner() {
        let state = await this.loadState(StoryRunner.AUTOSAVE_FILENAME);
        if (state == null)
            state = new this.options.stateConstructor;
        state.validate();

        const ctor = this.getSceneConstructor(state.sceneClassName);
        if (ctor == null)
            throw new StorySceneNotFoundError(state.sceneClassName);
        let scene = this.createSceneWithState(ctor, state);

        while (scene != null) {
            scene = await this.runScene(scene);
        }
    }

    async runScene(scene: StoryScene): Promise<StoryScene> {
        await this.saveState(StoryRunner.AUTOSAVE_FILENAME, scene.state);
        let resultScene = scene;
        await this.render(scene);
        let userInput = (await this.readInput()) ?.trim();
        
    }

    // Override me
    async readInput(): Promise<String> {
    }

    // Override me
    async render(scene: StoryScene) {
        const elements = scene.render();
    }

    // Override me
    async loadState(fileName: string): Promise<StoryState> {
        const stateAsText = localStorage.getItem(this.getScopedFileName(fileName));
        if (stateAsText != null && stateAsText.length > 0) {
            const stateObject = JSON.parse(stateAsText);
            const state = Object.assign(new this.options.stateConstructor, stateObject);
            return state;
        } else
            return null;
    }

    // Override me
    getScopedFileName(fileName: string) {
        return this.options.appPrefix + '.' + fileName + '.json';
    }

    // Override me
    async saveState(fileName: string, state: StoryState) {
        const stateAsText = JSON.stringify(state);
        localStorage.setItem(this.getScopedFileName(fileName), stateAsText);
    }

    getSceneConstructor(sceneClassName: string): StorySceneConstructor {
        return this.options.sceneMap[sceneClassName];
    }

    createSceneWithState(ctor: StorySceneConstructor, state: StoryState): StoryScene {
        const scene = new ctor;
        scene.state = state;
        scene.state.sceneClassName = ctor['name'];
        scene.sceneMap = this.options.sceneMap;
        return scene;
    }
}