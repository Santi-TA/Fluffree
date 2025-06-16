
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
    import { getFirestore, collection, query, where, orderBy, getDocs, getDoc, addDoc, deleteDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
    import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
    
    const generarUUID = () => {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    };

const enlacesMapsPorZona = {
  "Cascajos": "https://www.google.com/maps?q=42.459902,-2.437725",
  "ElCubo": "https://www.google.com/maps?q=42.468170,-2.440045",
  "GranVia": "https://www.google.com/maps?q=42.466473,-2.445476"
};


    const firebaseConfig = {
      apiKey: "AIzaSyAcNsKVHM-L2aXsIG8YVdMOMfyRZs_lG_8",
      authDomain: "reserva-canina.firebaseapp.com",
      databaseURL: "https://reserva-canina-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "reserva-canina",
      storageBucket: "reserva-canina.appspot.com",
      messagingSenderId: "428071323887",
      appId: "1:428071323887:web:2a03d83e7380e9f66a331a",
      measurementId: "G-ZWLBZKJZYY"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const zoneSelect = document.getElementById('zoneSelect');
    const dateSelect = document.getElementById('dateSelect');
    const timeSelect = document.getElementById('timeSelect');
    const userReservationsDiv = document.getElementById('userReservations');
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const calendarContainer = document.getElementById('calendarContainer');

    let currentUser = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDayCell = null;

    const generateHourOptions = () => {
      const now = new Date();
      const today = dateSelect.value === new Date().toISOString().split('T')[0];
      const currentHour = now.getHours();

      timeSelect.innerHTML = '<option value="">Seleccione una hora</option>';

      for (let h = 8; h <= 23; h++) {
        if (today && h <= currentHour) continue;
        const hourStr = (h < 10 ? "0" + h : h) + ":00";
        const option = document.createElement('option');
        option.value = hourStr;
        option.textContent = hourStr;
        timeSelect.appendChild(option);
      }
    };

const loadAvailableHours = async () => {
  const selectedZone = zoneSelect.value;
  const selectedDate = dateSelect.value;
  if (!selectedZone || !selectedDate) return;

  generateHourOptions();

  const q = query(
    collection(db, "reservas"),
    where("zona", "==", selectedZone),
    where("fecha", "==", Timestamp.fromDate(new Date(selectedDate)))
  );

  const snapshot = await getDocs(q);



  
  const reservedTimes = snapshot.docs.map(doc => doc.data().hora);

Array.from(timeSelect.options).forEach(opt => {
  const baseText = opt.value;
  opt.textContent = baseText;
  opt.disabled = false;

  const reservasParaEsaHora = snapshot.docs.filter(doc => doc.data().hora === opt.value);
  const esIndividual = reservasParaEsaHora.some(doc => doc.data().tipo === "individual");
  const esGrupalCompleta = reservasParaEsaHora.length >= 2;

  if (esIndividual || esGrupalCompleta) {
    opt.disabled = false;
    opt.textContent += " (Ocupada - Lista de espera disponible)";
    opt.dataset.listaEspera = "true";
  } else if (reservasParaEsaHora.length === 1 && reservasParaEsaHora[0].data().tipo === "grupal") {
    opt.textContent += " (Grupal - 1 plaza libre)";
  }
});

timeSelect.addEventListener('change', async () => {
  const zona = zoneSelect.value;
  const fecha = dateSelect.value;
  const hora = timeSelect.value;
  const botonesDiv = document.getElementById('reservationButtons');

  if (!zona || !fecha || !hora) {
    botonesDiv.style.display = 'none';
    return;
  }

  const q = query(
    collection(db, "reservas"),
    where("zona", "==", zona),
    where("fecha", "==", Timestamp.fromDate(new Date(fecha))),
    where("hora", "==", hora)
  );

  const snapshot = await getDocs(q);
  const reservas = snapshot.docs.map(doc => doc.data());

  const individual = reservas.some(r => r.tipo === "individual");
  const grupales = reservas.filter(r => r.tipo === "grupal");

  const individualBtn = document.getElementById('individualBtn');
  const groupBtn = document.getElementById('groupBtn');

if (individual || grupales.length >= 2) {
  botonesDiv.style.display = 'block';
  botonesDiv.innerHTML = ''; 

  const listaBtn = document.createElement('button');
  listaBtn.textContent = "Apuntarme en lista de espera";
  listaBtn.addEventListener('click', () => apuntarseListaEspera(zona, fecha, hora));
  botonesDiv.appendChild(listaBtn);
} else if (grupales.length === 1) {
  botonesDiv.style.display = 'block';
  botonesDiv.innerHTML = '';
  const groupBtn = document.createElement('button');
  groupBtn.textContent = "Reserva grupal";
  groupBtn.addEventListener('click', () => reservarHora("grupal"));
  botonesDiv.appendChild(groupBtn);
} else {
  botonesDiv.style.display = 'block';
  botonesDiv.innerHTML = '';

  const individualBtn = document.createElement('button');
  individualBtn.textContent = "Reserva individual";
  individualBtn.addEventListener('click', () => reservarHora("individual"));

  const groupBtn = document.createElement('button');
  groupBtn.textContent = "Reserva grupal";
  groupBtn.addEventListener('click', () => reservarHora("grupal"));

  botonesDiv.appendChild(individualBtn);
  botonesDiv.appendChild(groupBtn);
}

});


};


const cargarReservasUsuario = async () => {
  if (!currentUser) return;

  userReservationsDiv.innerHTML = ""; 
  const ahora = new Date();

  
  const qReservas = query(
    collection(db, "reservas"),
    where("uid", "==", currentUser.uid)
  );

  const snapshot = await getDocs(qReservas);

  const reservas = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data();

      let fechaObj;
      if (data.fecha instanceof Object && typeof data.fecha.toDate === 'function') {
        fechaObj = data.fecha.toDate();
      } else {
        const [year, month, day] = data.fecha.split("-");
        fechaObj = new Date(`${year}-${month}-${day}`);
      }

      const [hora, minutos] = data.hora.split(":").map(Number);
      fechaObj.setHours(hora, minutos || 0, 0, 0);

      return {
        id: docSnap.id,
        tipo: data.tipo,
        zona: data.zona,
        hora: data.hora,
        fechaObj,
        codigoQR: data.codigoQR 
      };
    })
    .filter(reserva => {
      const finReserva = new Date(reserva.fechaObj.getTime() + 60 * 60 * 1000);
      return ahora < finReserva;
    });

  reservas.sort((a, b) => a.fechaObj - b.fechaObj);

 
  if (reservas.length === 0) {
    const noReservas = document.createElement('p');
    noReservas.textContent = "No tienes reservas futuras.";
    userReservationsDiv.appendChild(noReservas);
  } else {
    const contenedorReservas = document.createElement('div');
    contenedorReservas.innerHTML = '<table><tr><th>Zona</th><th>Tipo</th><th>Fecha</th><th>Hora</th><th>Acción</th></tr></table>';
    const tablaReservas = contenedorReservas.querySelector('table');

    reservas.forEach(reserva => {
      const fechaFormateada = `${reserva.fechaObj.getDate().toString().padStart(2, '0')}-${(reserva.fechaObj.getMonth() + 1).toString().padStart(2, '0')}-${reserva.fechaObj.getFullYear()}`;
      const fila = document.createElement('tr');
      const accionesDiv = document.createElement('div');

      const ahora = new Date();
      const reservaInicio = new Date(reserva.fechaObj);
      const [horaReserva, minutosReserva] = reserva.hora.split(":").map(Number);
      reservaInicio.setHours(horaReserva, minutosReserva || 0, 0, 0);

      const reservaVisibleDesde = new Date(reservaInicio.getTime() - 5 * 60 * 1000);
      const reservaFin = new Date(reservaInicio.getTime() + 60 * 60 * 1000);
      const cancelarVisibleHasta = new Date(reservaInicio.getTime() - 5 * 60 * 1000);

      if (ahora < cancelarVisibleHasta) {
        const cancelarBtn = document.createElement('button');
        cancelarBtn.textContent = "Cancelar";
        cancelarBtn.addEventListener('click', () => cancelarReserva(reserva.id));
        accionesDiv.appendChild(cancelarBtn);
      }

      if (ahora >= reservaVisibleDesde && ahora <= reservaFin) {
        const avisoBtn = document.createElement('button');
        avisoBtn.textContent = "Aviso de desperfectos";
        avisoBtn.style.marginTop = "5px";
        avisoBtn.addEventListener('click', () => {
          mostrarFormularioAviso(reserva);
        });
        accionesDiv.appendChild(document.createElement('br'));
        accionesDiv.appendChild(avisoBtn);

        const mostrarQRBtn = document.createElement('button');
        mostrarQRBtn.textContent = "🔓 QR";
        mostrarQRBtn.style.marginTop = "5px";
        mostrarQRBtn.addEventListener('click', () => {
          const qrData = reserva.codigoQR;
          if (!qrData) {
            alert("No se encontró código QR.");
            return;
          }
          mostrarQR(qrData);
        });

        accionesDiv.appendChild(document.createElement('br'));
        accionesDiv.appendChild(mostrarQRBtn);
      }

      fila.innerHTML = `
        <td>${reserva.zona}</td>
        <td>${reserva.tipo === "grupal" ? "Grupal" : "Individual"}</td>
        <td>${fechaFormateada}</td>
        <td>${reserva.hora}</td>
      `;

      const accionesCell = document.createElement('td');
      accionesCell.appendChild(accionesDiv);
      fila.appendChild(accionesCell);

      tablaReservas.appendChild(fila);
    });

    userReservationsDiv.appendChild(contenedorReservas);
  }


  const qLista = query(
    collection(db, "listas_espera"),
    where("uid", "==", currentUser.uid)
  );

  const listaSnap = await getDocs(qLista);

  if (!listaSnap.empty) {
    const contenedorLista = document.createElement('div');
    contenedorLista.innerHTML = "<br><br><h3>Listas de espera</h3><br><table><tr><th>Zona</th><th>Fecha</th><th>Hora</th><th>Acción</th></tr></table>";
    const tablaLista = contenedorLista.querySelector('table');

    listaSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const docId = docSnap.id;
      const fechaObj = data.fecha.toDate();
      const fechaFormateada = `${fechaObj.getDate().toString().padStart(2, '0')}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}-${fechaObj.getFullYear()}`;

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${data.zona}</td>
        <td>${fechaFormateada}</td>
        <td>${data.hora}</td>
      `;

      const cancelarBtn = document.createElement('button');
      cancelarBtn.textContent = "Cancelar";
      cancelarBtn.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, "listas_espera", docId));
          alert("Lista de espera cancelada");
          setTimeout(() => {
            cargarReservasUsuario();
          }, 100);
        } catch (err) {
          console.error("Error al cancelar lista de espera:", err);
          alert("Error al cancelar.");
        }
      });

      const cell = document.createElement('td');
      cell.appendChild(cancelarBtn);
      fila.appendChild(cell);
      tablaLista.appendChild(fila);
    });

    userReservationsDiv.appendChild(contenedorLista);
  }
};




window.cancelarReserva = async (id) => {
  const reservaRef = doc(db, "reservas", id);
  const reservaSnap = await getDoc(reservaRef);

  if (!reservaSnap.exists()) {
    alert("Reserva no encontrada.");
    return;
  }

  const { zona, fecha, hora } = reservaSnap.data();
  const enlaceMaps = enlacesMapsPorZona[zona] || "https://www.google.com/maps";


  await deleteDoc(reservaRef);

  try {
    const qLista = query(
      collection(db, "listas_espera"),
      where("zona", "==", zona),
      where("fecha", "==", fecha),
      where("hora", "==", hora),
      orderBy("timestamp")
    );

    const listaSnap = await getDocs(qLista);

    if (!listaSnap.empty) {
      const primero = listaSnap.docs[0];
      const { uid, email } = primero.data();

      const codigoQR = generarUUID();

      await addDoc(collection(db, "reservas"), {
        uid,
        email,
        zona,
        fecha,
        hora,
        tipo: "individual",
        codigoQR
      });

      await deleteDoc(doc(db, "listas_espera", primero.id));

      await emailjs.send("service_gnou14n", "template_confirmacion", {
        to_email: email,
        zona: zona,
        fecha: fecha.toDate().toLocaleDateString("es-ES"),
        hora: hora,
        maps_link: enlaceMaps
      });
    }
  } catch (err) {
    console.error("Error al promover desde la lista de espera:", err);
  }


  alert("Reserva cancelada");

  cargarReservasUsuario();
  loadAvailableHours();
};



  const storage = getStorage(app);

const reservarHora = async (tipo) => {
  const zona = zoneSelect.value;
  const fecha = dateSelect.value;
  const hora = timeSelect.value;
  const enlaceMaps = enlacesMapsPorZona[zona] || "https://www.google.com/maps";


  if (!zona || !fecha || !hora || !currentUser) {
    alert("Completa todos los campos");
    return;
  }

  const q = query(
    collection(db, "reservas"),
    where("zona", "==", zona),
    where("fecha", "==", Timestamp.fromDate(new Date(fecha))),
    where("hora", "==", hora)
  );

  const snapshot = await getDocs(q);


  const qUsuario = query(
  collection(db, "reservas"),
  where("uid", "==", currentUser.uid),
  where("fecha", "==", Timestamp.fromDate(new Date(fecha))),
  where("hora", "==", hora)
);
const snapshotUsuario = await getDocs(qUsuario);

if (!snapshotUsuario.empty) {
  alert("Ya tienes una reserva a esa hora en otra zona.");
  return;
}



  if (tipo === "individual") {
    if (!snapshot.empty) {
      alert("Hora ya ocupada");
      return;
    }
  } else if (tipo === "grupal") {
    if (snapshot.docs.length >= 2) {
      alert("Ya hay demasiadas personas en esta franja");
      return;
    }

    const yaEstá = snapshot.docs.some(doc => doc.data().uid === currentUser.uid);
    if (yaEstá) {
      alert("Ya estás en esta franja");
      return;
    }
  }

  const codigoQR = generarUUID();

  await addDoc(collection(db, "reservas"), {
    uid: currentUser.uid,
    email: currentUser.email,
    zona,
    fecha: Timestamp.fromDate(new Date(fecha)),
    hora,
    tipo,
    codigoQR
  });

const fechaObj = new Date(fecha); 

  emailjs.send("service_gnou14n", "template_confirmacion", {
    to_email: currentUser.email,
    zona: zona,
    fecha: fechaObj.toLocaleDateString("es-ES"),
    hora: hora,
    maps_link: enlaceMaps
  });

  alert("Reserva realizada y confirmación enviada por email");
  cargarReservasUsuario();
  loadAvailableHours();
  document.getElementById('reservationButtons').style.display = 'none';
};



const apuntarseListaEspera = async (zona, fecha, hora) => {
  if (!zona || !fecha || !hora || !currentUser) {
    alert("Completa todos los campos.");
    return;
  }

  const yaApuntado = await getDocs(query(
    collection(db, "listas_espera"),
    where("uid", "==", currentUser.uid),
    where("zona", "==", zona),
    where("fecha", "==", Timestamp.fromDate(new Date(fecha))),
    where("hora", "==", hora)
  ));

  if (!yaApuntado.empty) {
    alert("Ya estás en la lista de espera para esa franja.");
    return;
  }

  await addDoc(collection(db, "listas_espera"), {
    uid: currentUser.uid,
    email: currentUser.email,
    zona,
    fecha: Timestamp.fromDate(new Date(fecha)),
    hora,
    timestamp: Timestamp.now()
  });

  alert("Te has apuntado a la lista de espera.");
  cargarReservasUsuario();
};







    const populateMonthYearSelectors = () => {
      monthSelect.innerHTML = "";
      yearSelect.innerHTML = "";

      for (let m = 0; m < 12; m++) {
        const option = document.createElement('option');
        const monthName = new Date(0, m).toLocaleString('es-ES', { month: 'long' });
        option.value = m;
        option.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        monthSelect.appendChild(option);
      }

      const currentYearValue = new Date().getFullYear();
      for (let y = currentYearValue - 2; y <= currentYearValue + 2; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
      }
    };

    const renderCalendar = () => {
      calendarContainer.innerHTML = "";
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      monthSelect.value = currentMonth;
      yearSelect.value = currentYear;

      const table = document.createElement('table');
      const headerRow = document.createElement('tr');
      ["L", "M", "X", "J", "V", "S", "D"].forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      const pad = (n) => n.toString().padStart(2, '0');
      let date = 1;
      for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
          const cell = document.createElement('td');
          if (i === 0 && j < (firstDay === 0 ? 6 : firstDay - 1)) {
            cell.textContent = "";
          } else if (date <= daysInMonth) {
            cell.textContent = date;

            const thisDateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(date)}`;

            if (dateSelect.value === thisDateStr) {
              cell.classList.add('selected-day');
              selectedDayCell = cell;
            }

            cell.addEventListener('click', () => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const cellDate = new Date(thisDateStr);
              cellDate.setHours(0, 0, 0, 0);

              if (cellDate < today) {
                alert("No puedes seleccionar un día pasado.");
                return;
              }

              dateSelect.value = thisDateStr;
              loadAvailableHours();

              if (selectedDayCell) {
                selectedDayCell.classList.remove('selected-day');
              }
              cell.classList.add('selected-day');
              selectedDayCell = cell;
            });


            date++;
          } else {
            cell.textContent = "";
          }
          row.appendChild(cell);
        }
        table.appendChild(row);
      }
      calendarContainer.appendChild(table);
    };

    document.getElementById('prevMonth').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    monthSelect.addEventListener('change', () => {
      currentMonth = parseInt(monthSelect.value);
      renderCalendar();
    });

    yearSelect.addEventListener('change', () => {
      currentYear = parseInt(yearSelect.value);
      renderCalendar();
    });

    document.getElementById('individualBtn').addEventListener('click', () => reservarHora("individual"));
    document.getElementById('groupBtn').addEventListener('click', () => reservarHora("grupal"));

    zoneSelect.addEventListener('change', loadAvailableHours);

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('zoneContainer').style.display = 'block';
    zoneSelect.value = ""; 
    document.getElementById('timeContainer').style.display = 'none'; 

    cargarReservasUsuario();
    populateMonthYearSelectors();
    renderCalendar();
  } else {
    alert("Debes iniciar sesión");
    window.location.href = "index.html";
  }
});

dateSelect.addEventListener('change', () => {
  if (dateSelect.value) {
    document.getElementById('zoneContainer').style.display = 'block';
  } else {
    document.getElementById('zoneContainer').style.display = 'none';
    document.getElementById('timeContainer').style.display = 'none';
    zoneSelect.value = "";
    timeSelect.innerHTML = '<option value="">Seleccione una hora</option>';
  }
});

zoneSelect.addEventListener('change', () => {
  if (zoneSelect.value) {
    document.getElementById('timeContainer').style.display = 'block';
    loadAvailableHours();
  } else {
    document.getElementById('timeContainer').style.display = 'none';
    timeSelect.innerHTML = '<option value="">Seleccione una hora</option>';
  }
});

setInterval(() => {
  if (currentUser) {
    cargarReservasUsuario();
  }
}, 60000); 



let qrEmailsEnviados = new Set();

setInterval(async () => {
  if (!currentUser) return;

  const q = query(
    collection(db, "reservas"),
    where("uid", "==", currentUser.uid)
  );
  const snapshot = await getDocs(q);

  const ahora = new Date();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.codigoQR || !data.fecha || !data.hora) return;

    const fechaObj = data.fecha.toDate();
    const [h, m] = data.hora.split(":").map(Number);
    fechaObj.setHours(h, m || 0, 0, 0);

    const diffMs = fechaObj.getTime() - ahora.getTime();
    const cincoMin = 5 * 60 * 1000;

    if (diffMs > 0 && diffMs <= cincoMin) {
      const idUnico = doc.id + "_qr";
      if (!qrEmailsEnviados.has(idUnico)) {
        qrEmailsEnviados.add(idUnico);

        emailjs.send("service_gnou14n", "template_qr_aviso", {
          to_email: currentUser.email,
          zona: data.zona,
          fecha: fechaObj.toLocaleDateString("es-ES"),
          hora: data.hora,
          codigoQR: data.codigoQR
        });
      }
    }
  });
}, 60000); 




let reservaActualAviso = null;

const mostrarFormularioAviso = (reserva) => {
  reservaActualAviso = reserva;
  document.getElementById('avisoInfo').textContent = `Zona: ${reserva.zona} | Hora: ${reserva.hora}`;
  document.getElementById('avisoDescripcion').value = "";
  document.getElementById('avisoImagen').value = "";
  document.getElementById('avisoEstado').textContent = "";
  document.getElementById('avisoModal').style.display = "flex";
};

document.getElementById('cerrarAvisoBtn').addEventListener('click', () => {
  document.getElementById('avisoModal').style.display = "none";
});

document.getElementById('enviarAvisoBtn').addEventListener('click', async () => {
  const descripcion = document.getElementById('avisoDescripcion').value.trim();
  const imagenFile = document.getElementById('avisoImagen').files[0];
  const estado = document.getElementById('avisoEstado');

  if (!descripcion) {
    alert("Escribe una descripción.");
    return;
  }

  estado.textContent = "Enviando aviso...";

  let imageUrl = null;

  if (imagenFile) {
    const formData = new FormData();
    formData.append("file", imagenFile);
    formData.append("upload_preset", "reserva_canina"); 

    try {
      const resp = await fetch("https://api.cloudinary.com/v1_1/dajllvsi9/image/upload", {
        method: "POST",
        body: formData
      });

      const data = await resp.json();
      imageUrl = data.secure_url;
    } catch (err) {
      console.error("Error al subir a Cloudinary:", err);
      estado.textContent = "Error al subir la imagen.";
      return;
    }
  }

  try {
    await addDoc(collection(db, "avisos"), {
      uid: currentUser.uid,
      email: currentUser.email,
      zona: reservaActualAviso.zona,
      fecha: reservaActualAviso.fechaObj,
      hora: reservaActualAviso.hora,
      descripcion,
      imageUrl: imageUrl || null,
      timestamp: Timestamp.now()
    });

    estado.textContent = "Aviso enviado correctamente.";
    setTimeout(() => {
      document.getElementById('avisoModal').style.display = "none";
    }, 1000);
  } catch (err) {
    console.error("Error al guardar el aviso:", err);
    estado.textContent = "Error al guardar el aviso.";
  }
});


const mostrarQR = (data) => {
  console.log("Contenido del QR:", data);

  const modal = document.createElement('div');
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  const qrContainer = document.createElement('div');
  qrContainer.style.position = "relative";
  qrContainer.style.background = "white";
  qrContainer.style.padding = "40px 20px 20px 20px";
  qrContainer.style.borderRadius = "10px";
  qrContainer.style.textAlign = "center";
  qrContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  qrContainer.style.minWidth = "240px";

  const closeBtn = document.createElement('button');
  closeBtn.textContent = "Cerrar";
  closeBtn.style.display = "block";
  closeBtn.style.margin = "0 auto 10px auto";  
  closeBtn.onclick = () => modal.remove();

  const qrDiv = document.createElement('div');
  qrContainer.appendChild(closeBtn);
  qrContainer.appendChild(qrDiv);
  modal.appendChild(qrContainer);
  document.body.appendChild(modal);

  setTimeout(() => {
    new QRCode(qrDiv, {
      text: data,
      width: 200,
      height: 200
    });
  }, 0);
};


