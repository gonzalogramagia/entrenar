import React from 'react'
import { Box, IconButton } from '@mui/material'
import { ClipboardClock, Smile, Music, BicepsFlexed } from 'lucide-react'
import { GitHub as GithubIcon } from '@mui/icons-material'
import { useLanguage } from '../../contexts/LanguageContext'

const FloatingLinks: React.FC = () => {
    const { language } = useLanguage()
    const langPrefix = language === 'en' ? '/en' : ''

    // URLs para emojis según idioma
    const emojisUrl = `https://emojis.gonzalogramagia.com${langPrefix}`

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
                    display: 'none',
                    flexDirection: 'row',
                    gap: 1.5,
                    zIndex: 999,
                    '@media (min-width: 768px)': {
                        left: 32,
                        display: 'flex',
                    },
                }}
            >
                <IconButton
                    component="a"
                    href={`https://today.gonzalogramagia.com${langPrefix}`}
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label="Ir a Today"
                    title="Go to Today"
                >
                    <ClipboardClock className="icon" style={iconStyles} />
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
                    title="Go to Emojis"
                >
                    <Smile className="icon" style={iconStyles} />
                </IconButton>

                {/* Music */}
                <IconButton
                    component="a"
                    href={`https://music.gonzalogramagia.com${langPrefix}`}
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label="Ir a Música"
                    title="Go to Music"
                >
                    <Music className="icon" style={iconStyles} />
                </IconButton>

                {/* Entrenar (deshabilitado) */}
                <span title="You are here!" style={{ display: 'inline-block' }}>
                    <IconButton
                        disabled
                        sx={disabledButtonStyles}
                        aria-label="Ya estás acá!"
                    >
                        <BicepsFlexed style={iconStyles} />
                    </IconButton>
                </span>
            </Box>

            <Box
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    display: 'none',
                    zIndex: 999,
                    '@media (min-width: 768px)': {
                        right: 32,
                        display: 'block',
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
                            color: '#eab308',
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

