document.addEventListener('DOMContentLoaded', () => {
    const pasos = document.querySelectorAll('.paso');
    const btnSig = document.getElementById('btn-siguiente');
    const btnAnt = document.getElementById('btn-anterior');
    const barra = document.getElementById('barra-progreso-fill');
    const pasoTxt = document.getElementById('paso-info');
    const statusTxt = document.getElementById('status-blender');
    const inputs = document.querySelectorAll('select, input');
    let pasoActual = 0;

    // Navegación
    const actualizarNav = () => {
        pasos.forEach((p, i) => p.classList.toggle('activo', i === pasoActual));
        const pct = ((pasoActual + 1) / pasos.length) * 100;
        barra.style.width = `${pct}%`;
        pasoTxt.textContent = `Paso ${pasoActual + 1} de ${pasos.length}`;
        btnAnt.disabled = pasoActual === 0;
        btnSig.disabled = pasoActual === pasos.length - 1;
    };
    btnSig.onclick = () => { if(pasoActual < pasos.length-1) { pasoActual++; actualizarNav(); }};
    btnAnt.onclick = () => { if(pasoActual > 0) { pasoActual--; actualizarNav(); }};

    // Tinte
    document.getElementById('env_tinte').addEventListener('change', (e) => {
        document.getElementById('tinte_color').disabled = !e.target.checked;
    });

    async function procesarFenotipo() {
        // Genes
        const getG = (id) => document.getElementById(id).value;
        const genA = [getG('genA_padre'), getG('genA_madre')].sort().join('');
        const genC = [getG('genC_padre'), getG('genC_madre')].sort().join('');
        const genD = [getG('genD_padre'), getG('genD_madre')].sort().join('');
        const genE = [getG('genE_padre'), getG('genE_madre')].sort().join('');
        const genF = [getG('genF_padre'), getG('genF_madre')].sort().join('');
        
        // Objeto de datos
        let p = {
            sexo: (getG('cromo_padre') === 'Y') ? 'hombre' : 'mujer',
            colorCabello: (genA === 'aa') ? 'rubio' : 'cafe',
            colorPiel: (genC === 'CC') ? 'oscura' : (genC === 'cc' ? 'clara' : 'media'),
            estatura: (genE === 'ee') ? 'baja' : 'alta',
            tamanoNariz: (genF === 'ff') ? 'grande' : 'pequena',
            
            // Ambiente
            actividad: getG('env_actividad'),
            tinte: document.getElementById('env_tinte').checked ? getG('tinte_color') : null,
            quemadura: document.getElementById('env_quemadura').checked,
            botox: document.getElementById('env_botox').checked,
            piercing: document.getElementById('env_piercing').checked,
            tatuaje: document.getElementById('env_tatuaje').checked,
            cicatriz: document.getElementById('env_cicatriz').checked,

            // Mutaciones
            pecas: document.getElementById('mut_pecas').checked,
            pelirrojo: document.getElementById('mut_pelirrojo').checked,
            albinismo: document.getElementById('mut_albinismo').checked,
            calvicie: document.getElementById('mut_calvicie').checked,

            // Epigenética (NUEVO)
            epi_miedo: document.getElementById('epi_miedo').checked,
            epi_escasez: document.getElementById('epi_escasez').checked
        };

        // Lógica Prioridades
        if (p.albinismo) { 
            p.colorPiel = 'albina'; p.colorCabello = 'blanco'; 
        } else {
            if (p.pelirrojo) { p.colorCabello = 'pelirrojo'; p.colorPiel = 'muy-clara'; }
            if (p.quemadura) p.colorPiel = 'roja_quemada';
            if (p.tinte) p.colorCabello = p.tinte;
        }

        // Enviar a Blender
        try {
            const res = await fetch('http://localhost:5000/update', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(p)
            });
            if(res.ok) {
                statusTxt.innerHTML = "🟢 <b>Conectado</b>";
                statusTxt.className = "status-on";
            }
        } catch (e) {
            statusTxt.innerHTML = "🔴 <b>Desconectado</b>";
            statusTxt.className = "status-off";
        }

        // Resumen
        document.getElementById('resumen-contenido').innerHTML = `
            <strong>${p.sexo.toUpperCase()}</strong><br>
            Fenotipo: ${p.colorPiel}, ${p.colorCabello}<br>
            Epigenética: ${p.epi_miedo ? 'Trauma' : '-'} / ${p.epi_escasez ? 'Escasez' : '-'}
        `;
    }

    inputs.forEach(i => i.addEventListener('change', procesarFenotipo));
    actualizarNav();
    procesarFenotipo();
});