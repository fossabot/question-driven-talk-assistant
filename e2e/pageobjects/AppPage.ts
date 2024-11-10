import { Page } from '@playwright/test';
import {Question} from "../../src/components/QuestionItem";

export class AppPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto('/');
    }

    async setLocalStorageData<T>(key: string, value: T) {
        await this.page.evaluate(([key, value]) => {
            localStorage.setItem(key as string, JSON.stringify(value));
        }, [key, value]);
    }

    async getLocalStorageData<T>(key: string): Promise<T | null> {
        return await this.page.evaluate((key) => {
            const item = localStorage.getItem(key);
            if (!item) {
                return null;
            }
            try {
                return JSON.parse(item);
            } catch (e) {
                // content is not JSON
                return item;
            }
        }, key);
    }

    reload(options?: Parameters<Page['reload']>[0]): ReturnType<Page['reload']> {
        return this.page.reload(options);
    }

    async getQuestions(): Promise<Question[]> {
        return await this.getLocalStorageData<Question[]>("questions") || []
    }

    async preloadQuestionData(): Promise<Question[]> {
        const questions = [
            { id: 'first-question-id', text: 'First question\nWith two lines\n', answered: true, highlighted: false },
            { id: 'middle-question-id', text: '\n\nMiddle question with empty lines', answered: false, highlighted: true },
            { id: 'last-question-id', text: '', answered: false, highlighted: false },
        ];
        await this.setLocalStorageData('questions', questions);
        await this.reload();
        return questions;
    }

    async getQRCodeUrl(): Promise<string> {
        return await this.getLocalStorageData<string>("qrCodeURL") || "";
    }
}