const { app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, './assets/favicon.png'),
    })
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// the path variable the user manually defined
let userDefinedSavePath;

ipcMain.on('merge-pdf', async (event, filePaths) => {
    try {
        const mergedPdf = await PDFDocument.create();

        for (const filePath of filePaths) {
            //console.log("filePath: ", filePath);
            const pdfBytes = fs.readFileSync(filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        // Save the merged PDF
        const savePath =
            // set the path to default path (document directory) if user did not specify path
            path.join(userDefinedSavePath == null ? app.getPath("documents") : userDefinedSavePath, "merged.pdf");

        fs.writeFileSync(savePath, mergedPdfBytes);
        event.reply("merge-success", savePath);
    } catch (error) {
        event.reply("merge-error", error.message);
    }
});

ipcMain.on("split-pdf", async (event, filepath) => {
    try {
        const docAsBytes = await fs.promises.readFile(filepath);

        // load the specified pdf document
        const pdfDoc = await PDFDocument.load(docAsBytes);

        // get the directory to save the new document
        const directory = userDefinedSavePath == null ? app.getPath("documents") : userDefinedSavePath;

        // get number of pages of pdf document
        const numberOfPages = pdfDoc.getPageCount()

        for (let i = 0; i < numberOfPages; i++) {
            // create a new document
            const page = await PDFDocument.create();
            // copy page to new document
            const [copiedPage] = await page.copyPages(pdfDoc, [i]);
            // add copied page to new pdf
            page.addPage(copiedPage);
            // get new document as bytes
            const splitPDFBytes = await page.save();

            // get save path for new document
            const savePath = path.join(directory, `file-${i + 1}.pdf`);
            // write new document
            await fs.promises.writeFile(savePath, splitPDFBytes)
        }
        event.reply("split-success", directory);
    }
    catch (error) {
        event.reply("split-error", error.message);
    }

});


// handle for selecting the directory/folder for writing documents
ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
    });

    // return default path if result was canceled
    if (result.canceled) {
        return app.getPath("documents");
    }
    // return user defined path
    else {
        userDefinedSavePath = result.filePaths[0];
        return userDefinedSavePath;
    }
});