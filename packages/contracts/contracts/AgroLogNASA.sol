// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgroLogNASA
/// @notice Registro on-chain de decisiones agrícolas basadas en datos satelitales de la NASA.
/// @dev Contrato didáctico para el hackathon "Field Shift". Sin permisos ni lógica compleja.
contract AgroLogNASA {
    /// @notice Un reporte climático/agrícola enviado por un agricultor.
    struct ReporteClimatico {
        address agricultor;       // Quién firmó la transacción
        string parcela;           // Nombre o sector de la parcela
        uint256 humedadSuelo;     // Humedad del suelo en % (dato tipo NASA SMAP)
        string decisionSiembra;   // Acción agrícola recomendada
        uint256 timestamp;        // Momento del registro (segundos Unix)
    }

    /// @notice Lista pública de todos los reportes. Solidity crea un getter reportes(indice).
    ReporteClimatico[] public reportes;

    /// @notice Cantidad máxima de reportes que devuelve obtenerUltimosReportes.
    uint256 public constant MAX_ULTIMOS = 10;

    /// @notice Se emite cada vez que alguien registra un reporte.
    event NuevoReporteRegistrado(
        address indexed agricultor,
        string parcela,
        uint256 humedadSuelo,
        string decisionSiembra,
        uint256 timestamp
    );

    /// @notice Devuelve cuántos reportes existen.
    function obtenerTotalReportes() external view returns (uint256) {
        return reportes.length;
    }

    /// @notice Devuelve los últimos reportes guardados (máximo MAX_ULTIMOS), del más antiguo al más reciente.
    function obtenerUltimosReportes() external view returns (ReporteClimatico[] memory) {
        uint256 total = reportes.length;
        uint256 cantidad = total < MAX_ULTIMOS ? total : MAX_ULTIMOS;
        ReporteClimatico[] memory ultimos = new ReporteClimatico[](cantidad);

        for (uint256 i = 0; i < cantidad; i++) {
            ultimos[i] = reportes[total - cantidad + i];
        }
        return ultimos;
    }

    /// @notice Guarda un nuevo reporte firmado por quien llama.
    /// @param _parcela Nombre o sector de la parcela.
    /// @param _humedadSuelo Humedad del suelo en porcentaje.
    /// @param _decisionSiembra Acción agrícola recomendada.
    function registrarReporte(
        string memory _parcela,
        uint256 _humedadSuelo,
        string memory _decisionSiembra
    ) external {
        reportes.push(
            ReporteClimatico({
                agricultor: msg.sender,
                parcela: _parcela,
                humedadSuelo: _humedadSuelo,
                decisionSiembra: _decisionSiembra,
                timestamp: block.timestamp
            })
        );

        emit NuevoReporteRegistrado(msg.sender, _parcela, _humedadSuelo, _decisionSiembra, block.timestamp);
    }
}
