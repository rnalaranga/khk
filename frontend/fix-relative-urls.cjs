const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function fixUrls(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            fixUrls(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            const regex1 = /`http:\/\/\$\{window\.location\.hostname\}:5000\/api/g;
            const regex2 = /`http:\/\/\$\{window\.location\.hostname\}:5000\/uploads/g;
            
            let updatedContent = content.replace(regex1, '`/api');
            updatedContent = updatedContent.replace(regex2, '`/uploads');
            
            if (content !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`Fixed: ${filePath}`);
            }
        }
    });
}

fixUrls(directoryPath);
