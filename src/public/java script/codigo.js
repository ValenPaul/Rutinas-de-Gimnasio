

// 🧪 Formularios simulados
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Inicio de sesión exitoso (simulado)');
    mostrarSeccion('inicio');
});

document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Registro exitoso (simulado)');
    mostrarSeccion('login');
});


const API_URL = window.location.origin.includes("git-feature-subi-0b262a") 
  ? "https://rutinas-de-gimnasio-git-prueba-valenpauls-projects.vercel.app"
  : "https://cristianschmidt.vercel.app";



// 🔄 Cargar compras desde backend
async function cargarCompras() {
    const usuarioId = 1; // TODO: cambiar por el ID del usuario logueado
    const tbody = document.getElementById('compras-body');

    // Mostrar estado de carga
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align:center; color:gray;">Cargando compras...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_URL}/api/compras/usuario/${usuarioId}`);

        if (!res.ok) {
            throw new Error(`Error ${res.status}: No se pudieron obtener las compras`);
        }

        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; color:gray;">No hay compras registradas</td>
                </tr>
            `;
            return;
        }

        // Limpiar antes de agregar las filas
        tbody.innerHTML = "";

        data.forEach(compra => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${compra.nombre}</td>
                <td>${compra.rutina}</td>
                <td>${new Date(compra.fecha_compra).toLocaleDateString('es-AR')}</td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; color:red;">Error al cargar las compras</td>
            </tr>
        `;
    }
}


// 👁 Mostrar sección (Inicio, Login o Registro)
function mostrarSeccion(seccionId) {
    const secciones = ['inicio', 'login', 'registro', 'mis-compras'];
    secciones.forEach(id => {
        document.getElementById(id).style.display = (id === seccionId) ? 'block' : 'none';
    });

    // Si se muestra la sección de compras, cargarlas
    if (seccionId === 'mis-compras') {
        cargarCompras();
    }
}

function comprarRutina(rutinaId, nombreRutina, precio) {
    const usuarioId = sessionStorage.getItem('usuarioId'); // usuario logueado

    fetch(`${API_URL}/api/compras/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, rutinaId, nombreRutina, precio })
    })
    .then(res => res.json())
    .then(data => {
        if (data.init_point) {
            window.location.href = data.init_point; // Redirigir a Mercado Pago
        } else {
            alert('Error al generar el pago');
        }
    })
    .catch(err => console.error(err));
}


document.querySelectorAll(".btnComprar").forEach((boton) => {
    boton.addEventListener("click", async (e) => {
    try {
        // Datos de ejemplo de la rutina o producto
        const producto = {
            titulo: "Rutina Premium de 30 días",
            precio: 1, // precio en ARS
            cantidad: 1
        };

        // Crear la preferencia de pago en el backend
        const resp = await fetch(`${API_URL}/api/crear-preferencia`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(producto)
        });

        const data = await resp.json();

        if (data.init_point) {
            // Redirigir a Mercado Pago
            window.location.href = data.init_point;
        } else {
            alert("No se pudo generar el pago");
        }
    } catch (error) {
        console.error("Error al iniciar el pago:", error);
    }
})});
