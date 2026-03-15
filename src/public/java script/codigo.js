const { TokenExpiredError } = require("jsonwebtoken");

const API_URL = window.location.origin;

// SOLO PARA DESARROLLO LOCAL, probar frontend
  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    localStorage.setItem("token", "dev-token");
    localStorage.setItem("usuario", JSON.stringify({ 
      nombre: "Admin Dev",
      rol: "admin"
  }));
}

function verificarSesion() {
  const token = localStorage.getItem("token")
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const estado = document.getElementById("estadoSesion")
  const boton = document.getElementById("btnCerrarSesion")


  if (token) {
    estado.innerHTML = `Hola ${usuario?.nombre}`
    boton.style.display = 'block'

    //  MOSTRAR PANEL SOLO SI ES ADMIN
    if (usuario.rol === "admin") {
      document.getElementById("linkAdmin").style.display = "block";
    }
  } 
  else {
    estado.innerHTML = "⚠️ No estás logueado"
    boton.style.display = 'none'
  }

  
}
verificarSesion()


function cerrarSesion() {
  localStorage.removeItem("token")
  alert("Sesión cerrada correctamente")
  verificarSesion()
  mostrarSeccion("login")
}

document.getElementById("btnCerrarSesion").addEventListener("click", () => {
  cerrarSesion()
});



  //login real
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const resp = await fetch(`${API_URL}/api/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.error || "Error al iniciar sesión");
      return;
    }

    // 🔐 GUARDAR TOKEN
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    

    alert("Inicio de sesión exitoso");
    mostrarSeccion("inicio");
    verificarSesion()

  } catch (error) {
    console.error("Error login:", error);
    alert("Error de conexión");
  }
});

// registro real
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const contraseña = document.getElementById("register-password").value;

  try {
    const resp = await fetch(`${API_URL}/api/usuarios/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, contraseña })
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.error || "Error al registrarse");
      return;
    }

    alert("✅ Usuario registrado correctamente");
    mostrarSeccion("inicio");
    verificarSesion();

  } catch (error) {
    console.error("Error registro:", error);
    alert("Error de conexión");
  }
});



// 🔄 Cargar compras desde backend
async function cargarMisCompras() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Debes iniciar sesión primero");
    mostrarSeccion("login");
    return;
  }

  const resp = await fetch(`${API_URL}/api/compras/mis-compras`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (resp.status === 401 || resp.status === 403) {
    alert("Tu sesión expiró. Volvé a iniciar sesión.")
    localStorage.removeItem("token")
    mostrarSeccion("login");
    return
  }

  const compras = await resp.json();
  console.log("Respuesta:", compras)

  const contenedor = document.getElementById("lista-compras");
  contenedor.innerHTML = "";

  if (compras.length === 0) {
    contenedor.innerHTML = "<p>No compraste ninguna rutina todavía.</p>";
    return;
  }

  compras.forEach(c => {
    contenedor.innerHTML += `
      <div class="compra-card">

        <div class="compra-card-content">

          <h3>${c.nombre}</h3>
          <p>Comprada el: ${new Date(c.fecha_pago).toLocaleDateString()}</p>
          <button onclick="descargarRutina('${c.rutina_id}')">
            📥 Descargar PDF
          </button>
          <a 
          href="https://youtube.com/shorts/QRo9z67pWDQ?si=i19AD7uUVohW4J22"
          target="_blank"
          rel="noopener"
          class="link-cuaderno"
          >
            ▶ Cómo utilizar el cuaderno
          </a>
          
        </div>

      </div>
    `;
  });
}

async function descargarRutina(rutinaId) {
  const token = localStorage.getItem("token");
  console.log("token", token);

  const resp = await fetch(`${API_URL}/api/compras/descargar/${rutinaId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await resp.json();
  console.log("DATA COMPLETA:", data);
  
// para que no se abra la ventana en blanco cuando hay error
  if (data.error) {
    alert(data.error);
    return;
  }

  if (!data.url) {
    alert("No se pudo generar la descarga");
    return;
  }
  

  // Abrir PDF en nueva pestaña
  window.open(data.url, "_blank");
}



// 👁 Mostrar sección (Inicio, Login o Registro)
function mostrarSeccion(seccionId) {
    const secciones = ['inicio', 'login', 'registro', 'mis-compras', 'admin-panel'];
    secciones.forEach(id => {
        document.getElementById(id).style.display = (id === seccionId) ? 'block' : 'none';
    });

    // Si se muestra la sección de compras, cargarlas
    if (seccionId === 'mis-compras') {
        cargarMisCompras();
    }
}

function scrollCompras(direccion) {
  const carrusel = document.getElementById("lista-compras");

  carrusel.scrollBy({
    left: direccion * 400,
    behavior: "smooth"
  });
}

// Funcion cargar usuarios
async function cargarUsuarios() {
  const token = localStorage.getItem("token");

  const resp = await fetch(`${API_URL}/api/admin/usuarios`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await resp.json();

  const cont = document.getElementById("admin-data");
  cont.innerHTML = "<h3>Usuarios registrados:</h3>";

  data.forEach(u => {
    cont.innerHTML += `
      <div class="admin-card">
        <p><b>${u.nombre}</b></p>
        <p>${u.email}</p>
        <p>Rol: ${u.rol}</p>
      </div>
    `;
  });
}

// Funcion cargar pagos
async function cargarPagos() {
  const token = localStorage.getItem("token");

  const resp = await fetch(`${API_URL}/api/admin/pagos`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const pagos = await resp.json();

  const cont = document.getElementById("admin-data");
  cont.innerHTML = "<h3>Pagos registrados:</h3>";

  pagos.forEach(p => {
    cont.innerHTML += `
      <div class="admin-card">
        <p><b>${p.email}</b> compró <b>${p.rutina}</b></p>
        <p>Monto: $${p.monto}</p>
        <p>Fecha: $${p.fecha_pago}</p>
        <p>Email enviado: ${p.email_enviado ? "✅" : "❌"}</p>
        <p>Error: ${p.error_email || "-"}</p>
      </div>
    `;
  });
}

function verMasInfo(id) {

  const info = {
    1: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 3 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
      </ul>
    `,
    2: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 4 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
        <li>Como trabajar el RIR</li>
      </ul>
    `,
    3: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 5 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
        <li>RIR y dropset</li>
      </ul>
    `,
    4: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 3 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
      </ul>
    `,
    5: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 4 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
        <li>Como trabajar el RIR</li>
      </ul>
    `,
    6: `
      <p><strong>Incluye:</strong></p>
      <ul>
        <li>Rutina de Hipertrofia de 5 días</li>
        <li>Planificación de 12 semanas de entrenamiento</li>
        <li>Cuaderno de entrenamiento para que registres tu progreso</li>
        <li>Videos explicativos de cada ejercicio y movilidad</li>
        <li>Explicación de cómo manejar los pesos, la sobrecarga progresiva y el descanso</li>
        <li>RIR y dropset</li>
      </ul>
    `,
    7: `
      <p><strong>Asesoria Personalizada</strong></p>
      <ul>
        <li>1 mes: $40.000</li>
        <li>3 meses: $110.000</li>
      </ul>
    `
  };

  document.getElementById("contenidoModal").innerHTML = `
      <h2>Detalle del plan</h2>
      <p>${info[id]}</p>
    `;

  document.getElementById("modalInfo").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modalInfo").style.display = "none";
}



document.querySelectorAll(".btnComprar").forEach((boton) => {
  boton.addEventListener("click", async () => {
    
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    if (resp.status === 401 || resp.status === 403) {
        alert("Tu sesión expiró. Iniciá sesión nuevamente.");
        localStorage.removeItem("token");
        mostrarSeccion("login");
        return;
    }

    if (!token) {
      alert("Debés iniciar sesión para comprar esta rutina");
      
      // 👉 llevar al login
      mostrarSeccion("login");
      return; // ⛔ cortar acá
    }

    try {
      

      const rutinaId = boton.dataset.id;

      const resp = await fetch(`${API_URL}/api/compras/crear-preferencia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rutina_id: rutinaId
        })
      });

      

      if (!resp.ok) {
        const error = await resp.text();
        console.error("Error backend:", resp.status, error);
        alert("No se pudo generar el pago");
        return;
      }

      const data = await resp.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("No se pudo generar el pago");
      }

    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    }
  });
});

document.querySelectorAll(".ContacAseso").forEach((boton) => {
  boton.addEventListener("click", async () => {
    
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    if (!token) {
      alert("Debés iniciar sesión para comprar esta rutina");
      
      // 👉 llevar al login
      mostrarSeccion("login");
      return; // ⛔ cortar acá
    }

    window.open("https://wa.me/3435021983", "_blank")

  });
});
