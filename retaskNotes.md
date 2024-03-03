# TODO

- [ ] need to figure out how to save hotkeys and move them to testing instances and also app settings. maybe the data file?
- [ ] is ribbon ordering saved in data file or workspace?

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
