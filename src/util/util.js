function converterHora(horaAmericana) {
    let periodo = horaAmericana.slice(-2); // Pega AM ou PM
    let [horas, minutos] = horaAmericana.slice(0, -2).split(':'); // Separa horas e minutos

    horas = parseInt(horas);

    if (periodo === 'PM' && horas !== 12) {
        horas += 12;
    } 
    // else if (periodo === 'AM' && horas === 12) {
    //     horas = 0; // Corrige 12 AM para 00h
    // }

    // Formata a hora com dois dígitos
    let horasFormatadas = horas.toString().padStart(2, '0');
    
    return `${horasFormatadas}:${minutos}`;
}

function formatarData(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // Janeiro é 0, por isso adicionamos 1
    const ano = date.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
    converterHora,
    formatarData
};