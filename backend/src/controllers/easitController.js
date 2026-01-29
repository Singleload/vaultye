import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const exportToEasit = async (req, res) => {
  const data = req.body;

  // 1. Konfigurera sökväg (Windows T-disk)
  // OBS: Dubbla backslashes krävs i strängar för att undkomma escape-tecken.
  const targetDir = 'T:\\IT-kontoret\\Easit\\MoveFiles\\';
  
  // Fallback för testning om T: saknas (skapar en mapp i projektet istället)
  // const targetDir = path.join(process.cwd(), 'easit_exports'); 

  try {
    // 2. Se till att mappen finns (om behörighet finns)
    if (!fs.existsSync(targetDir)) {
      // Försök skapa mappen om den saknas (kanske inte funkar på root T: men bra practice)
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        console.warn(`Kunde inte skapa mapp på ${targetDir}. Kontrollera att T: är mappad.`);
        return res.status(500).json({ error: `Kunde inte komma åt ${targetDir}` });
      }
    }

    // 3. Skapa CSV-innehåll
    // Vi definierar ordningen på kolumnerna
    const headers = ['externalId', 'system', 'title', 'description', 'requester', 'dueDate', 'originalPointId'];
    
    // Hjälpfunktion för att städa text (hantera " och , och nya rader)
    const escapeCsv = (text) => {
      if (!text) return '';
      const stringText = String(text);
      // Om texten innehåller , " eller ny rad måste den omges av " "
      // Dubbla " måste bli ""
      if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
        return `"${stringText.replace(/"/g, '""')}"`;
      }
      return stringText;
    };

    const row = [
      escapeCsv(data.externalId),
      escapeCsv(data.system),
      escapeCsv(data.title),
      escapeCsv(data.description),
      escapeCsv(data.requester),
      escapeCsv(data.dueDate),
      escapeCsv(data.originalPointId)
    ];

    // CSV-strängen (Header + Rad)
    // Eftersom du sa att Easit hämtar filer, kanske den vill ha headers varje gång? 
    // Oftast vill import-script ha en header-rad.
    const csvContent = `${headers.join(',')}\n${row.join(',')}`;

    // 4. Generera unikt filnamn
    // Format: easit_export_TIMESTAMP_UUID.csv
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `easit_export_${timestamp}_${uuidv4().slice(0, 8)}.csv`;
    const fullPath = path.join(targetDir, filename);

    // 5. Skriv filen
    fs.writeFileSync(fullPath, csvContent, 'utf8');

    console.log(`✅ CSV sparad till: ${fullPath}`);
    
    res.json({ message: 'Exporterad till Easit', path: fullPath });

  } catch (error) {
    console.error('Easit export error:', error);
    res.status(500).json({ error: 'Kunde inte spara CSV-filen', details: error.message });
  }
};