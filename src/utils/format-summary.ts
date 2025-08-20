export default function formatSummaryText(text: string | undefined | null): string {
  if (!text) return '';

  let result = text;

  result = result.replace(/```[a-zA-Z]+\n/g, '```'); 
  result = result.replace(/\*\*(.*?)\*\*/g, (_match, p1) => `<strong>${p1}</strong>`); 
  result = result.replace(/\*(.*?)\*/g, (_match, p1) => `<em>${p1}</em>`); 
  result = result.replace(/~(.*?)~/g, (_match, p1) => `<del>${p1}</del>`); 
  result = result.replace(/^### (.*)$/gm, (_match, p1) => `<h3>${p1}</h3>`); 
  result = result.replace(/^## (.*)$/gm, (_match, p1) => `<h2>${p1}</h2>`); 
  result = result.replace(/^# (.*)$/gm, (_match, p1) => `<h1>${p1}</h1>`); 
  
  
  result = result.replace(/^\s*[-*+]\s+(.*)/gm, (_match, p1) => `<li>${p1}</li>`);
  
  if (result.includes("<li>")) {
      result = `<ul>${result.replace(/<\/li>\s*<li>/g, '</li><li>')}</ul>`;
      
      result = result.replace(/<ul>\s*<\/ul>/g, '');
  }
  
  
  result = result.replace(/^\s*\d+\.\s+(.*)/gm, (_match, p1) => `<li class="ml-4">${p1}</li>`);
   if (result.includes('<li class="ml-4">')) {
       result = `<ol>${result.replace(/<\/li>\s*<li class="ml-4">/g, '</li><li class="ml-4">')}</ol>`;
       result = result.replace(/<ol>\s*<\/ol>/g, '');
   }

  result = result.replace(/\n/g, '<br />'); 

  return result;
}