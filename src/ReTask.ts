import moment from 'moment'; //RETASK: ADDED
import type { Task } from 'Task/Task';
import type { unitOfTime } from 'moment/moment';
import { getTaskLineAndFile } from 'Obsidian/File';

import { setTimeout } from 'timers/promises';

export class ReTask {
    public static async retask() {
        console.log('Retask.retask ran');
    }

    public static async today() {
        console.log('Retask.today() ran');

        const openFilePath = app.workspace.activeEditor?.file?.path!;

        if (!openFilePath.match('periodic-notes')) return;

        // determine destination file. if the currently open file is today or the future then pen moves task to currently open file.
        // if the currently open file is in the past, then pen moves the task to "today"
        const currentFileDate = new Date(Date.parse(app.workspace.activeEditor?.file?.basename + ' 00:00:00'));
        // below makes a string similar to this > 2024-01-08
        const todayDateString = this.dateToYYYYMMDD(currentFileDate);

        const todayReTask = [
            '```tasks',
            'not done',
            'scheduled on ' + todayDateString,
            'group by scheduled reverse',
            'short',
            '```',
            '***',
        ];

        // MAKE ARRAY FROM SOURCE FILE and splice the task out of it
        const sourceFileArray = await this.makeSourceFileArray(openFilePath);
        const retaskLocation = this.arraySubArrayFind(sourceFileArray, todayReTask);

        if (retaskLocation == -1) {
            // this means we need to add the tasks string
            sourceFileArray.unshift(todayReTask.join('\n'));
        } else {
            // this means we need to remove the tasks string
            sourceFileArray.splice(retaskLocation as number, todayReTask.length);
        }

        await app.vault.adapter.write(openFilePath, sourceFileArray.join('\n'));
    }

    public static async promoteTask(task: Task) {
        console.log('left click pencil'); //TODO REMOVE ME

        const openFilePath = app.workspace.activeEditor?.file?.path!;

        // MAKE ARRAY FROM SOURCE FILE and splice the task out of it
        const sourceFileArray = await this.makeSourceFileArray(task.taskLocation.path);
        sourceFileArray.splice(task.taskLocation.lineNumber, 1);

        // IF THIS IS TRUE WE ARE USING THE SAME FILE FOR SOURCE AND DESTINATION SO FOCUS ON LINE
        if (task.taskLocation.path == openFilePath) {
            const result = await getTaskLineAndFile(task, app.vault);
            if (result) {
                const [line, file] = result;
                const leaf = app.workspace.getLeaf();
                // When the corresponding task has been found,
                // suppress the default behavior of the mouse click event
                // (which would interfere e.g. if the query is rendered inside a callout).
                // Instead of the default behavior, open the file with the required line highlighted.
                await leaf.openFile(file, { eState: { line: line } });
            }
            return;
        }

        // determine destination file. if the currently open file is today or the future then pen moves task to currently open file.
        // if the currently open file is in the past, then pen moves the task to "today"
        const pencilOpenFileDate = new Date(Date.parse(app.workspace.activeEditor?.file?.basename + ' 00:00:00'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fileInPast = pencilOpenFileDate < today;

        const todayPathString = this.dateToNotePath(today);

        // if file is in the past then the destination of the write is today, if its today or the future the destination of the write is the open file in the window
        let pathToUse = null;
        if (fileInPast) {
            if (!(await app.vault.adapter.exists(todayPathString))) await this.createAndPopulateNote(today);
            pathToUse = todayPathString;
        } else {
            pathToUse = openFilePath;
        }

        const destinationFileArray = await this.spliceTaskIntoFileArray(pathToUse, task);

        await app.vault.adapter.write(pathToUse, destinationFileArray!.join('\n'));
        await app.vault.adapter.write(task.taskLocation.path, sourceFileArray.join('\n'));
    }

    public static async postponeTask(task: Task, amount: number, timeUnit: unitOfTime.DurationConstructor) {
        console.log(task.originalMarkdown); //TODO REMOVE ME
        console.log('right clicked arrows selection'); //TODO REMOVE ME

        // MAKE ARRAY FROM SOURCE FILE and splice the task out of it
        const sourceFileArray = await this.makeSourceFileArray(task.taskLocation.path);
        sourceFileArray.splice(task.taskLocation.lineNumber, 1);

        // determine if the currently open file date is in the past/present or in the future
        // if the day is in the past or present, we add duration to current date.
        // if the day is in the future we use that file's date as the relative date for postpoining

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const openFileDate = new Date(Date.parse(app.workspace.activeEditor?.file?.basename + ' 00:00:00'));

        const taskDate = new Date(Date.parse(task.filename + ' 00:00:00'));

        let targetDate = null;
        if (today >= taskDate) {
            targetDate = moment(today).startOf('day').add(amount, timeUnit).toDate();
        } else {
            targetDate = moment(taskDate).startOf('day').add(amount, timeUnit).toDate(); // day is in the future
        }

        // IF THIS IS TRUE WE ARE USING THE SAME FILE FOR SOURCE AND DESTINATION SO SOMETHING IS WRONG
        if (openFileDate == targetDate) return;

        const targetPathString = this.dateToNotePath(targetDate);

        // MAKE ARRAY OUT OF DESTINATION FILE and make path if file doesn't exist. fill new file with template.
        if (!(await app.vault.adapter.exists(targetPathString))) await this.createAndPopulateNote(targetDate);
        const destinationFileArray = await this.spliceTaskIntoFileArray(targetPathString, task);

        await app.vault.adapter.write(targetPathString, destinationFileArray.join('\n'));
        await app.vault.adapter.write(task.taskLocation.path, sourceFileArray.join('\n'));
    }

    public static async postponeTaskTomorrow(task: Task) {
        console.log(task.originalMarkdown); //TODO REMOVE ME
        console.log('left click arrows'); //TODO REMOVE ME

        // MAKE ARRAY FROM SOURCE FILE and splice the task out of it
        const taskSourceFileArray = await this.makeSourceFileArray(task.taskLocation.path);
        taskSourceFileArray.splice(task.taskLocation.lineNumber, 1);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const openFileDate = new Date(Date.parse(app.workspace.activeEditor?.file?.basename + ' 00:00:00'));

        const arrowsfileInPast = openFileDate < today;

        // set target date to one day after the date of the currently open file
        const targetDate = new Date(openFileDate);
        targetDate.setDate(targetDate.getDate() + 1);

        if (arrowsfileInPast) {
            // change the target date to tomorrow if the arrows file is in the past because we dont want to assign to a historical date.
            targetDate.setDate(today.getDate() + 1);
        }

        // IF THIS IS TRUE WE ARE USING THE SAME FILE FOR SOURCE AND DESTINATION SO SOMETHING IS WRONG
        if (openFileDate == targetDate) return;

        // periodic-notes/2024/2024-01/2024-01-08.md
        const targetPathString = this.dateToNotePath(targetDate);

        // MAKE ARRAY OUT OF DESTINATION FILE and make path if file doesn't exist. fill new file with template.
        if (!(await app.vault.adapter.exists(targetPathString))) await this.createAndPopulateNote(targetDate);

        const destinationFileArray = await this.spliceTaskIntoFileArray(targetPathString, task);

        await app.vault.adapter.write(targetPathString, destinationFileArray.join('\n'));
        await app.vault.adapter.write(task.taskLocation.path, taskSourceFileArray.join('\n'));
    }

    private static dateToNotePath(date: Date) {
        const DD = date.getDate();
        const MM = date.getMonth() + 1; // 0 is January, so we must add 1
        const YYYY = date.getFullYear();

        // below makes a string similar to this > periodic-notes/2024/2024-01/2024-01-08.md
        return (
            'periodic-notes/' +
            YYYY +
            '/' +
            YYYY +
            '-' +
            MM.toString().padStart(2, '0') +
            '/' +
            YYYY +
            '-' +
            MM.toString().padStart(2, '0') +
            '-' +
            DD.toString().padStart(2, '0') +
            '.md'
        );
    }

    private static dateToMonthFolderPath(date: Date) {
        const MM = date.getMonth() + 1; // 0 is January, so we must add 1
        const YYYY = date.getFullYear();

        // below makes a string similar to this > periodic-notes/2024/2024-01
        return 'periodic-notes/' + YYYY + '/' + YYYY + '-' + MM.toString().padStart(2, '0');
    }

    private static dateToYearFolderPath(date: Date) {
        const YYYY = date.getFullYear();

        // below makes a string similar to this > periodic-notes/2024
        return 'periodic-notes/' + YYYY;
    }

    private static dateToYYYYMMDD(date: Date) {
        const DD = date.getDate();
        const MM = date.getMonth() + 1; // 0 is January, so we must add 1
        const YYYY = date.getFullYear();

        // below makes a string similar to this > 2024-01-08
        return YYYY + '-' + MM.toString().padStart(2, '0') + '-' + DD.toString().padStart(2, '0');
    }

    private static makeSourceFileArray(path: string) {
        return app.vault.adapter.read(path).then((fileString) => fileString.split('\n'));
    }

    private static async createAndPopulateNote(date: Date) {
        const yyyymmdd = this.dateToYYYYMMDD(date);
        // paragraph.replace("Ruth's", 'my');
        // beasts.indexOf('bison')

        const todayYearFolderPathString = this.dateToYearFolderPath(date);
        const todayMonthFolderPathString = this.dateToMonthFolderPath(date);

        // make year folder if it doesnt exist
        if (!(await app.vault.adapter.exists(todayYearFolderPathString))) {
            await app.vault.adapter.mkdir(todayYearFolderPathString);
        }
        // make month folder if it doesnt exist
        if (!(await app.vault.adapter.exists(todayMonthFolderPathString))) {
            await app.vault.adapter.mkdir(todayMonthFolderPathString);
        }

        let dailyTemplate = await app.vault.adapter.read('Templates/daily.md');
        dailyTemplate = dailyTemplate.replace(
            '<% tp.file.cursor() %><%* app.workspace.activeLeaf.view.editor?.focus(); %>',
            '',
        );

        const updatedDailyTemplate = dailyTemplate.replace(
            '<% tp.date.now("YYYY-MM-DD", 0, tp.file.title, "YYYY-MM-DD") %>',
            yyyymmdd,
        );

        await app.vault.create(this.dateToNotePath(date), updatedDailyTemplate);
    }

    private static async spliceTaskIntoFileArray(destinationPath: string, task: Task) {
        const destinationFileArray = await this.makeSourceFileArray(destinationPath);

        const pathParts = destinationPath.split('/');
        const filename = pathParts.pop();
        const fileParts = filename!.split('.md');
        const basename = fileParts.shift();

        const destinationFileDate = new Date(Date.parse(basename + ' 00:00:00'));
        // below makes a string similar to this > 2024-01-08
        const fileDateString = this.dateToYYYYMMDD(destinationFileDate);

        const taskQueryString = [
            '```tasks',
            'not done',
            'scheduled before ' + fileDateString,
            'group by scheduled reverse',
            'short',
            '```',
        ];

        // DETERMINE RETASK INPUT LOCATION IN DESTINATION FILE
        const markerString = '<= retask =>';
        const markerStringLocation = destinationFileArray?.lastIndexOf(markerString);
        const taskQueryStringLocation = this.arraySubArrayFind(destinationFileArray, taskQueryString);

        // line number to put task in destination file
        let retaskLocation = null;

        if (markerStringLocation != -1) {
            // if marker string is found, put the task there
            retaskLocation = markerStringLocation;
        } else if (taskQueryStringLocation != -1) {
            // if marker string is not found BUT tasks query string IS found, then task should go one line before tasks string
            retaskLocation = (taskQueryStringLocation as number) - 1;

            // put an empty line above tasks query if its not there
            if (destinationFileArray[(taskQueryStringLocation as number) - 1] != '') {
                destinationFileArray.splice(taskQueryStringLocation as number, 0, '');
                // retaskLocation = (taskQueryStringLocation as number) - 1;
                retaskLocation = taskQueryStringLocation;
            }
        } else {
            // if marker string is not found AND tasks query string is not found, append to end of file.
            retaskLocation = destinationFileArray.length;
        }

        destinationFileArray.splice(retaskLocation as number, 0, task.originalMarkdown);

        return destinationFileArray;
    }

    private static arraySubArrayFind(full: string[], slice: string[]) {
        if (slice.length === 0) {
            return true;
        }

        const candidateIndexes = full
                .map((element, fullIndex) => ({
                    matched: element === slice[0],
                    fullIndex,
                }))
                .filter(({ matched }) => matched),
            found = candidateIndexes.find(({ fullIndex }) =>
                slice.every(
                    (element, sliceIndex) =>
                        Object.hasOwn(full, fullIndex + sliceIndex) && element === full[fullIndex + sliceIndex],
                ),
            );

        // console.log(found);
        // return Boolean(found);
        if (found == undefined) {
            return -1;
        } else {
            return found.fullIndex;
        }
    }
}
