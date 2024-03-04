current notes.

- moving without retask marker line is not working for some reason. works in dev but not in qa.
  - will move forward with just keeping retask string for now
- need to add short to task string in prod
- need to add child-detecting algo that looks for any indentation and just returns with a message to the user explaining
- add child handling moves that takes children with parents. just keeps including lines until it finds one that is either top level or does not start with a dash.

# TODO

- [ ] need to figure out how to save hotkeys and move them to testing instances and also app settings. maybe the data file?
- [ ] is ribbon ordering saved in data file or workspace?


to move for deploy:
- data.json
- main.js
- manifest.json
- styles.css

workspace.json segment about ribbon
  },
  "left-ribbon": {
    "hiddenItems": {
      "switcher:Open quick switcher": false,
      "graph:Open graph view": false,
      "canvas:Create new canvas": false,
      "daily-notes:Open today's daily note": false,
      "command-palette:Open command palette": false,
      "templater-obsidian:Templater": false,
      "obsidian-retasks-plugin:ReTask Today": false,
      "periodic-notes:Open today": false
    }

cmd -r reload

{
  "app:reload": [
    {
      "modifiers": [
        "Mod"
      ],
      "key": "R"
    }
  ]
}

## later stuff

- [ ] double check that the un-edited tasks app is slowing down mobile and submit a help support issue or something
- [ ] explore what function we could add to the right click of the link button in short mode
- [ ] can a ribbon action be made to open another vault?
- [ ] main.ts investigate id: 'run-retask-command-complex' and if it's the right command format. do we need complex?

## retask button stuff

- [ ] First press of retask button adds tasks query to bottom. If that’s already there, it adds retask today section to the top. If both are there it removes the top section “toggling” it
- [ ] Right click on retask button gives you options to remove either retask query, task query, or both. Also option to just retask today query. These all have associated commands

# acceptance criteria

## Browser

-- need to add command and button functionality test criteria
-- add ac criteria for retask today section

- [x] does retask fucntion work with marker?
- [-] does retask fucntion work without marker?

- if the open document (and, thus, the task) is in the past
  - [x] pen moves task to today
  - [x] click on arrow moves to tomorrow
  - [x] left-click dates are relative to today
  - [x] left-click on pencil opens edit menu

- if the open document is today and task is in the past
  - [x] pen moves task to today
  - [x] click on arrow moves to tomorrow
  - [x] left-click dates are relative to today
  - [x] left-click on pencil opens edit menu

- if the open document is today and task is today
  - [x] pen focus's on the task in the open file
  - [x] click on arrow moves to tomorrow
  - [x] left-click dates are relative to today
  - [x] left-click on pencil opens edit menu

- if the document and task in the future
  - [x] the pen moves task to the currently open file
  - [x] clicking on the arrow moves task to the day after the currently open file
  - [x] left click dates are relative to the task being edited (not the currently open file) past relative to today and future relative to themselves
  - [x] left-click on pencil opens edit menu

- if document is in future and task is in past
  - [x] pen moves task to the currently open file
  - [x] click on arrow moves task to the day after the currently open file
  - [x] left-click dates are relative to today
  - [x] left-click on pencil opens edit menu

- if document is in the future and task is today
  - [x] pen moves task to the currently open file
  - [x] click on arrow moves task to the day after the currently open file
  - [x] left-click dates are relative to today
  - [x] left-click on pencil opens edit menu
