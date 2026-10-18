<?php


final class UsuarioController
{
    public function __construct(
        private UsuarioService $usuarioService
    ) {
    }

    public function crear(): void
    {
        $contenido = file_get_contents('php://input');

        try {
            $datos = json_decode(
                $contenido,
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException) {
            Response::json([
                'error' => 'El contenido JSON no es válido'
            ], 400);
        }

        $cedula = $datos['cedula'] ?? '';
        $usuario = $datos['usuario'] ?? '';
        $password = $datos['password'] ?? '';
        $rol = $datos['rol'] ?? '';

        if (
            $cedula === '' ||
            $usuario === '' ||
            $password === '' ||
            $rol === ''
        ) {
            Response::json([
                'error' => 'Todos los campos son obligatorios'
            ], 422);
        }

        try {
            $nuevoUsuario = $this->usuarioService->crear(
                $cedula,
                $usuario,
                $password,
                $rol
            );

            Response::json([
                'mensaje' => 'Usuario creado correctamente',
                'usuario' => $nuevoUsuario
            ], 201);
        } catch (RuntimeException $error) {
            $codigo = $error->getCode();

            if (!in_array($codigo, [409, 422], true)) {
                $codigo = 500;
            }

            Response::json([
                'error' => $error->getMessage()
            ], $codigo);
        }
    }

    public function listar(): void
{
    try {
        Response::json([
            'usuarios' =>
                $this->usuarioService->listarUsuarios()
        ]);
    } catch (Throwable $error) {
        error_log(
            $error::class . ': ' .
            $error->getMessage()
        );

        Response::json([
            'error' => 'No fue posible obtener los usuarios'
        ], 500);
    }
}

public function restaurarPassword(): void
{
    $contenido = file_get_contents('php://input');

    try {
        $datos = json_decode(
            $contenido,
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $this->usuarioService->restaurarPassword(
            (int) ($datos['id_usuario'] ?? 0),
            $datos['nueva_password'] ?? ''
        );

        Response::json([
            'mensaje' =>
                'La contraseña fue restaurada correctamente'
        ]);
    } catch (JsonException) {
        Response::json([
            'error' => 'El contenido JSON no es válido'
        ], 400);
    } catch (RuntimeException $error) {
        $codigo = $error->getCode();

        if ($codigo < 400 || $codigo > 499) {
            $codigo = 400;
        }

        Response::json([
            'error' => $error->getMessage()
        ], $codigo);
    }
}

}