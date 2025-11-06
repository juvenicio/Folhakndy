import { Font } from '@react-pdf/renderer';

// Registrar as fontes Calibri
Font.register({ family: 'Calibri', src: '/fonts/Calibri.ttf', fontStyle: 'normal', fontWeight: 'normal' });
Font.register({ family: 'Calibri-Bold', src: '/fonts/CALIBRIB.TTF', fontStyle: 'normal', fontWeight: 'bold' });
Font.register({ family: 'Calibri-Italic', src: '/fonts/CALIBRII.TTF', fontStyle: 'italic', fontWeight: 'normal' });
Font.register({ family: 'Calibri-BoldItalic', src: '/fonts/CALIBRIZ.TTF', fontStyle: 'italic', fontWeight: 'bold' });

// Registrar a fonte Arial
Font.register({ family: 'Arial', src: '/fonts/Calibri.ttf', fontStyle: 'normal', fontWeight: 'normal' });
// Registrar a versão negrito da fonte Arial, usando Calibri Bold como fallback
Font.register({ family: 'Arial', src: '/fonts/CALIBRIB.TTF', fontStyle: 'normal', fontWeight: 'bold' }); 
// Se você tiver os arquivos de fonte Arial, pode substituí-los aqui:
// Font.register({ family: 'Arial', src: '/fonts/Arial.ttf', fontStyle: 'normal', fontWeight: 'normal' });
// Font.register({ family: 'Arial-Bold', src: '/fonts/ARIALBD.TTF', fontStyle: 'normal', fontWeight: 'bold' });
// Font.register({ family: 'Arial-Italic', src: '/fonts/ARIALI.TTF', fontStyle: 'italic', fontWeight: 'normal' });
// Font.register({ family: 'Arial-BoldItalic', src: '/fonts/ARIALBI.TTF', fontStyle: 'italic', fontWeight: 'bold' });

// Registrar a fonte Times-Roman
Font.register({ family: 'Times-Roman' }); // Times-Roman é uma fonte padrão do @react-pdf/renderer