import { StoryElement } from "./storyElement";
import { StoryError, StorySceneNotFoundError } from "./StoryError";
import { StoryOptions } from "./storyOptions";
import { StoryRunnerCommand } from "./storyRunnerCommand";
import { StoryScene, StorySceneConstructor } from "./storyScene";
import { StoryState } from "./storyState";

export class StoryRunner {
    static readonly AUTO_SAVE_FILENAME = 'auto-save';
    static readonly QUICK_SAVE_FILENAME = 'quick-save';

    options: StoryOptions;

    constructor(options: StoryOptions) {
        options.validate();
        this.options = options;
    }

    async run() {
        await this.runInner();
    }

    async runInner() {
        let state = await this.loadState(StoryRunner.AUTO_SAVE_FILENAME);
        if (state == null) {
            state = new this.options.stateConstructor;
            state.validate();
        }

        const ctor = this.getSceneConstructor(state.sceneClassName);
        if (ctor == null)
            throw new StorySceneNotFoundError(state.sceneClassName);
        let scene = this.createSceneWithState(ctor, state);

        while (scene != null) {
            scene = await this.runScene(scene);
        }
    }

    async runScene(scene: StoryScene): Promise<StoryScene> {
        await this.saveState(StoryRunner.AUTO_SAVE_FILENAME, scene.state);
        let resultScene = scene;
        await this.render(scene);
        let userInput = (await this.readInput()) ?.trim();
        if (userInput == null) {
            await this.showMessage(['Game ended because of lack of user\'s input.'])
            return null;
        }
        await this.processCommand(userInput, scene);
    }

    async processCommand(command: string, scene: StoryScene) {
        switch (command) {
            case StoryRunnerCommand.status: {
                return this.createStatusScene(scene);
            }
            case StoryRunnerCommand.save: {
                const fileName = StoryRunner.QUICK_SAVE_FILENAME;
                await this.saveState(fileName, scene.state);
                await this.showMessage(['Saved as: ' + fileName]);
            }
            case StoryRunnerCommand.load: {
                const fileName = StoryRunner.QUICK_SAVE_FILENAME;
                const state = await this.loadState(fileName);
                if (state != null) {
                    const sceneConstructor = this.getRequiredSceneConstructor(state.sceneClassName);
                    const newScene = this.createSceneWithState(sceneConstructor, state);
                    await this.showMessage(['Loaded: ' + fileName]);
                    return newScene;
                } else
                    await this.showMessage(['Cannot load file: ' + fileName]);
            }
            case StoryRunnerCommand.exit: {
                await this.showMessage(['Game ended by user\'s request']);
                return null;
            }
        }
        return scene;
    }

    /** This function must be implemented in a descendant */
    async readInput(): Promise<String> {
        return null;
    }

    async render(scene: StoryScene) {
        const elements = scene.render();
        await this.showMessage(elements);
    }

    /** This function must be implemented in a descendant */
    async showMessage(elements: StoryElement[]) {
        for (const element of elements)
            console.log(element);
    }

    /** Load state from localStorage.
        This function can be optionally overridden in a descendant to save state to a different type of storage. */
    async loadState(fileName: string): Promise<StoryState> {
        const stateAsText = localStorage.getItem(this.getScopedFileName(fileName));
        if (stateAsText != null && stateAsText.length > 0) {
            const stateObject = JSON.parse(stateAsText);
            const state = Object.assign(new this.options.stateConstructor, stateObject) as StoryState;
            state.validate();
            return state;
        } else
            return null;
    }

    getScopedFileName(fileName: string) {
        return this.options.appPrefix + '.' + fileName + '.json';
    }

    /** Save state to localStorage.
        This function can be optionally overridden in a descendant to provide a different storage for saves. */
    async saveState(fileName: string, state: StoryState) {
        const stateAsText = JSON.stringify(state);
        localStorage.setItem(this.getScopedFileName(fileName), stateAsText);
    }

    getSceneConstructor(sceneClassName: string): StorySceneConstructor {
        return this.options.sceneMap[sceneClassName];
    }

    getRequiredSceneConstructor(sceneClassName: string): StorySceneConstructor {
        const ctor = this.getSceneConstructor(sceneClassName);
        if (ctor == null)
            throw new StorySceneNotFoundError('Scene not found: "' + sceneClassName + '"');
        return ctor;
    }

    createSceneWithState(ctor: StorySceneConstructor, state: StoryState): StoryScene {
        const scene = new ctor;
        scene.state = state;
        scene.state.sceneClassName = ctor['name'];
        scene.sceneMap = this.options.sceneMap;
        return scene;
    }

    createStatusScene(currentScene: StoryScene) {
        const returningSceneName = currentScene.state.sceneClassName;
        const statusSceneCtor = this.getRequiredSceneConstructor(currentScene.state.statusSceneClassName);
        const statusScene = this.createSceneWithState(statusSceneCtor, currentScene.state);
        // Avoid being locked into status scene by calling createStatusScene when currentScene is already status scene
        if (!(currentScene instanceof statusSceneCtor))
            statusScene.state.returningSceneName = returningSceneName;
        return statusScene;
    }
}