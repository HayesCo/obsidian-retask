import moment from 'moment'; //RETASK: ADDED
import type { Task } from 'Task/Task';
import type { unitOfTime } from 'moment/moment';

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
            '<= ReTaskToday =>',
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
        const markerString = '<= ReTaskToday =>';

        const lastloc = sourceFileArray?.lastIndexOf(markerString);

        // LOGIC: if lastloc =-1 then not found so we just append line to destfile otherwise we use lastloc + 1
        // we want to input at the end of the file or on top of the retask marker string
        console.log('printing lastloc');
        console.log(lastloc);

        if (lastloc == -1) {
            // this means we need to add the tasks string
            sourceFileArray.unshift(todayReTask.join('\n'));
        } else if (lastloc == 0) {
            // this means we need to remove the tasks string
            sourceFileArray.splice(0, todayReTask.length);
        } else {
            alert('ReTask Today marker not at the beginning of the file. Fix that for this to work.');
            console.log('unexpected lastloc');
            return;
        }

        await app.vault.adapter.write(openFilePath, sourceFileArray.join('\n'));
    }

    public static async promoteTask(task: Task) {
        console.log('left click pencil'); //TODO REMOVE ME

        const openFilePath = app.workspace.activeEditor?.file?.path!;

        // MAKE ARRAY FROM SOURCE FILE and splice the task out of it
        const sourceFileArray = await this.makeSourceFileArray(task.taskLocation.path);
        sourceFileArray.splice(task.taskLocation.lineNumber, 1);

        // IF THIS IS TRUE WE ARE USING THE SAME FILE FOR SOURCE AND DESTINATION SO SOMETHING IS WRONG
        if (task.taskLocation.path == openFilePath) return;

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

        const destinationFileArray = await this.makeSourceFileArray(pathToUse);
        this.spliceTaskIntoFileArray(destinationFileArray, task);

        await app.vault.adapter.write(pathToUse, destinationFileArray.join('\n'));
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
        let destinationFileArray: any = [];

        if (!(await app.vault.adapter.exists(targetPathString))) await this.createAndPopulateNote(targetDate);
        destinationFileArray = await this.makeSourceFileArray(targetPathString);

        this.spliceTaskIntoFileArray(destinationFileArray, task);

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

        // MAKE ARRAY OUT OF DESTINATION FILE
        let destinationFileArray: any = [];

        if (!(await app.vault.adapter.exists(targetPathString))) await this.createAndPopulateNote(targetDate);
        destinationFileArray = await this.makeSourceFileArray(targetPathString);

        this.spliceTaskIntoFileArray(destinationFileArray, task);

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
        await app.vault.create(this.dateToNotePath(date), dailyTemplate);
    }

    private static spliceTaskIntoFileArray(destinationFileArray: string[], task: Task) {
        // DETERMINE RETASK INPUT LOCATION IN DESTINATION FILE
        const markerString = '<= retask =>';
        let lastloc = destinationFileArray?.lastIndexOf(markerString);

        // LOGIC: if lastloc =-1 then not found so we just append line to destfile otherwise we use lastloc + 1
        // we want to input at the end of the file or on top of the retask marker string
        if (lastloc == -1) lastloc = destinationFileArray.length;
        destinationFileArray.splice(lastloc, 0, task.originalMarkdown);
    }
}
