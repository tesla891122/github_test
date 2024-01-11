var fs = require('fs');

fs.readdir('./', (error, files) => {
    if(error){
        console.log(error);
        return;
    }

    console.log(files);
})





