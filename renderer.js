// query selector for the html elements
const dropArea = document.querySelector('.drop-area');
const documents = document.querySelector('.document-list');
const mergeButton = document.querySelector('#Merge');
const splitButton = document.querySelector('#Split');
const selectPathButton = document.querySelector('#select-save-path');

const dragFile = dropArea.querySelector('.drag-file');
const selectButton = dropArea.querySelector('.button');
const fileInput = dropArea.querySelector('.input-files');

// dragover event listener
dropArea.addEventListener('dragover', (event) => {
    // prevent event listener to open the files
    event.preventDefault();
    dropArea.classList.add('green-border');
    dragFile.textContent = "Release to upload files";
});

// dragleave event listener
dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("green-border");
    dragFile.textContent = "Drop Files Here";
});

let currentNumberOfFiles = 0;
let filesArray = [];

/**
 * This function is responsible for visualizing documents that were added list
 * @param files
 */
function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            // create new file and add attributes to the new added file
            const newFile = document.createElement("li");
            newFile.draggable = true;
            newFile.textContent = files.item(i).name;
            newFile.classList.add(i.toString());
            newFile.className = "list-element";

            // create a delete button
            const deleteButton = document.createElement("button");
            deleteButton.classList.add('delete-button');
            deleteButton.className = "delete-button";

            // create the icon for the delete button
            const deleteImg = document.createElement("img");
            deleteImg.src = "./assets/delete.png";
            deleteImg.alt = 'Button Image';
            deleteImg.draggable = false;
            deleteImg.width = 15;
            deleteImg.height = 20;

            deleteButton.appendChild(deleteImg);

            // add event listener for removing the element
            deleteButton.addEventListener('click', () => {
                documents.removeChild(newFile);
                filesArray.splice(i, 1);
                currentNumberOfFiles--;
                updateButtons();
            })
            // append the delete button functionality
            newFile.appendChild(deleteButton);

            // push the file to the files array
            const file = files.item(i);
            const path = window.fileHandling.showFilePath(file);
            filesArray.push(path);

            //
            documents.appendChild(newFile);
            currentNumberOfFiles++;
            updateButtons();
        }
    }

// drop event listener
dropArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropArea.classList.remove("green-border");
    dragFile.textContent = "Drop Files Here";
    let files = event.dataTransfer.files;
    handleFiles(files);
});

// event listener for clicking on the select button to select files
selectButton.addEventListener('click', async () => {
    fileInput.click();
    selectButton.classList.add('button');
});

fileInput.addEventListener('change', async () => {
    const sortedFiles = Array.from(fileInput.files).sort((a, b) => a.name.localeCompare(b.name));
    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();
    // Add sorted files to DataTransfer
    sortedFiles.forEach(file => dataTransfer.items.add(file));
    const newFileList = dataTransfer.files;
    handleFiles(newFileList);
})

// change button availability depending on number of elements in files array
function updateButtons() {
    mergeButton.disabled = currentNumberOfFiles < 2;
    splitButton.disabled = currentNumberOfFiles >= 2 || currentNumberOfFiles === 0;
}

mergeButton.addEventListener('click', async () => {
    if (filesArray.length < 2) {
        alert("Requires two or more files for merging!");
        return;
    }
    // send file paths to main process
    window.mergeAPI.sendFilePaths(filesArray);
})

// merge success callback
window.mergeAPI.mergeSuccess();
// merge error callback
window.mergeAPI.mergeError();

splitButton.addEventListener('click', (event) => {
    if (filesArray.length > 1) {
        alert("Can only split one pdf document at once!");
        return;
    }
    // path of odf file to main process
    window.splitAPI.sendFilePath(filesArray.at(0));
})

//split success callback
window.splitAPI.splitSuccess();

// split error callback
window.splitAPI.splitError();


// event listener for selecting save path
selectPathButton.addEventListener('click', (event) => {
    event.preventDefault()
    const folderPath = window.mergeAPI.selectSavePath();
    folderPath.then((result) => {
        // set the file path to save the pdf file/files
        document.getElementById("current-directory").value = result;
    })
});
