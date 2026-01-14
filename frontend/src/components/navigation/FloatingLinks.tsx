import React from 'react'
import { Box, IconButton } from '@mui/material'
import { Home, Smile, Music, BicepsFlexed } from 'lucide-react'
import { GitHub as GithubIcon } from '@mui/icons-material'

const FloatingLinks: React.FC = () => {
    // URLs para emojis según idioma (puedes ajustar según tu lógica de i18n)
    const emojisUrl = 'https://emojis.gonzalogramagia.com'

    const buttonStyles = {
        p: 1.5,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '50%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            bgcolor: 'white',
            transform: 'scale(1.08)',
            boxShadow: '0 8px 12px -2px rgba(0, 0, 0, 0.2)',
        },
    }

    const disabledButtonStyles = {
        ...buttonStyles,
        opacity: 0.5,
        cursor: 'not-allowed',
        '&:hover': {
            bgcolor: 'white',
            boxShadow: buttonStyles.boxShadow,
            transform: 'none',
        },
    }

    const iconStyles = {
        width: 24,
        height: 24,
        color: 'text.primary',
        transition: 'color 0.2s ease-in-out',
    }

    return (
        <>
            {/* Botones de navegación izquierda - horizontal */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    left: 32,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1.5,
                    zIndex: 999,
                    '@media (min-width: 768px)': {
                        left: 32,
                    },
                }}
            >
                <IconButton
                    component="a"
                    href="https://gonzalogramagia.com"
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label="Ir a Home"
                    title="Ir a Home"
                >
                    <Home className="icon" style={iconStyles} />
                </IconButton>

                {/* Emojis */}
                <IconButton
                    component="a"
                    href={emojisUrl}
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label="Ir a Emojis"
                    title="Ir a Emojis"
                >
                    <Smile className="icon" style={iconStyles} />
                </IconButton>

                {/* Music */}
                <IconButton
                    component="a"
                    href="https://music.gonzalogramagia.com"
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label="Ir a Music"
                    title="Ir a Music"
                >
                    <Music className="icon" style={iconStyles} />
                </IconButton>

                {/* Entrenar (deshabilitado) */}
                <IconButton
                    disabled
                    sx={disabledButtonStyles}
                    aria-label="Ir a Entrenar"
                    title="Ir a Entrenar"
                >
                    <BicepsFlexed style={iconStyles} />
                </IconButton>
            </Box>

            {/* Botón de GitHub derecha - fuera del contenedor */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 999,
                    '@media (min-width: 768px)': {
                        right: 32,
                    },
                }}
            >
                <IconButton
                    component="a"
                    href="https://github.com/gonzalogramagia/entrenar"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#3b82f6',
                        },
                    }}
                    aria-label="Ver en GitHub"
                >
                    <GithubIcon className="icon" sx={iconStyles} />
                </IconButton>
            </Box>
        </>
    )
}

export default FloatingLinks
