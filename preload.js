const { contextBridge, webUtils, ipcRenderer, app } = require('electron')

contextBridge.exposeInMainWorld('fileHandling', {
    showFilePath (file) {

        const path = webUtils.getPathForFile(file)
        //alert(`Uploaded file path was: ${path}`)
        return path;
    }
});

contextBridge.exposeInMainWorld('mergeAPI', {
    sendFilePaths: (value) => ipcRenderer.send('merge-pdf', value),

    mergeSuccess: () => ipcRenderer.on('merge-success', (event, savePath) => {
        alert(`Merged PDF saved at: ${savePath}`);
    }),

    mergeError: () => ipcRenderer.on('merge-error', (event, error) => {
        alert(`Error merging PDFs: ${error}`);
    }),

    selectSavePath: async () => await ipcRenderer.invoke('select-folder'),
});

contextBridge.exposeInMainWorld('splitAPI', {
    sendFilePath: (value) => ipcRenderer.send('split-pdf', value),

    splitSuccess: () => ipcRenderer.on('split-success', (event, directoy) => {
        alert(`Split Pages saved in directory: ${directoy}`);
    }),

    splitError: () => ipcRenderer.on('split-error', (event, error) => {
        alert(`Error while splitting PDF: ${error}`);
    })
});

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector("current-directory").value = app.getPath("documents");
});