TODO:

- [ ] Get rid of Retask marker just use query string
  - [ ] For both marker strings they are optional and default to top/bottom if not present
- [ ] need to figure out how to save hotkeys and move them to testing instances and also app settings. maybe the data file?
- [ ] double check that the un-edited tasks app is slowing down mobile and submit a help support issue or something
- [ ] explore what function we could add to the right click of the link button in short mode
- [ ] is ribbon ordering saved in data file or workspace?
- [ ] can a ribbon action be made to open another vault?
- preset config options
  - turn off - set cancelled date on every canceled task
  - turn on - use file name as scheduled date for undated tasks
  - turn off - auto suggest task content

- main.ts investigate id: 'run-retask-command-complex' and if it's the right command format. do we need complex?


- [ ] First press of retask button adds tasks query to bottom. If that’s already there, it adds retask today section to the top. If both are there it removes the top section “toggling” it
- [ ] Right click on retask button gives you options to remove either retask query, task query, or both. Also option to just retask today query. These all have associated commands

acceptance criteria:

- check that currently open page is today.
  - if not launch notice
- if currently open file IS TODAY
  - check for today retask string
    - if present, remove
    - if not present, add before retask line.. or should it be after the line after today? or just add at line 7?

## Browser

-- need to add command and button functionality test criteria

- if the open document is in the past
  - [ ] pen moves task to today
  - [ ] click on arrow moves to tomorrow
    - [ ] right-click dates are relative to today
    - [ ] right-click on pencil opens edit menu

- if the open document is today and task is in the past
  - [x] pen moves task to today
  - [ ] click on arrow moves to tomorrow
  - [ ] right-click dates are relative to today
  - [ ] right-click on pencil opens edit menu

- if the open document is today and task is today
  - [x] pen does nothing (because of logic check moving file from today to today)
  - [ ] click on arrow moves to tomorrow
  - [ ] right-click dates are relative to today
  - [ ] right-click on pencil opens edit menu

- if the document is in the future
  - [ ] the pen moves task to the currently open file
  - [ ] clicking on the arrow moves task to the day after the currently open file
  - [ ] right click dates are relative to the task being edited (not the currently open file) past relative to today and future relative to themselves
  - [ ] right-click on pencil opens edit menu
