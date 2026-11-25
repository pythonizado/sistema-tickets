import json
import urllib.request
import urllib.error
import http.cookiejar
from getpass import getpass

URL_BASE = "http://localhost:8000"
URL_LOGIN = URL_BASE + "/api/login"
URL_TICKETS = URL_BASE + "/api/tickets"

CODIGO_SIN_SESION = 401


def crear_cliente():
    cookies = http.cookiejar.CookieJar()

    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookies)
    )


def enviar_peticion(cliente, peticion):
    try:
        with cliente.open(peticion, timeout=10) as respuesta:
            return respuesta.status

    except urllib.error.HTTPError as error:
        with error:
            return error.code


def enviar_login(cliente, usuario, password):
    datos = {
        "usuario": usuario,
        "password": password
    }

    contenido = json.dumps(datos).encode("utf-8")

    peticion = urllib.request.Request(
        URL_LOGIN,
        data=contenido,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    return enviar_peticion(cliente, peticion)


def consultar_tickets(cliente):
    peticion = urllib.request.Request(
        URL_TICKETS,
        headers={"Accept": "application/json"},
        method="GET"
    )

    return enviar_peticion(cliente, peticion)


def comprobar(nombre, codigo_recibido, codigos_esperados):
    if codigo_recibido in codigos_esperados:
        print("[CORRECTO] " + nombre)
    else:
        print(
            "[FALLO] " + nombre
            + ". Código recibido: " + str(codigo_recibido)
            + ". Se esperaba: " + str(codigos_esperados)
        )


def ejecutar_pruebas():
    # Primera prueba: consultar los tickets sin iniciar sesión.
    cliente_sin_sesion = crear_cliente()
    codigo = consultar_tickets(cliente_sin_sesion)

    comprobar(
        "La ruta rechaza una consulta sin sesión",
        codigo,
        [CODIGO_SIN_SESION]
    )

    # Segunda prueba: iniciar sesión y consultar con el mismo cliente.
    usuario = input("Usuario del docente de prueba: ")
    password = getpass("Contraseña del docente: ")

    cliente_docente = crear_cliente()
    codigo_login = enviar_login(cliente_docente, usuario, password)

    if codigo_login != 200:
        print(
            "[FALLO] El login del docente devolvió "
            + str(codigo_login)
            + ". Se esperaba 200."
        )
        return

    codigo = consultar_tickets(cliente_docente)

    comprobar(
        "La ruta permite la consulta con la sesión del docente",
        codigo,
        [200]
    )


try:
    ejecutar_pruebas()
except urllib.error.URLError as error:
    print("No se pudo completar la petición: " + str(error.reason))
except TimeoutError:
    print("Se agotó el tiempo de espera de la petición.")