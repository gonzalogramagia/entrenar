import React from 'react'
import { Box, IconButton } from '@mui/material'
import { Languages } from 'lucide-react'
import { GitHub as GithubIcon } from '@mui/icons-material'
import { useLanguage } from '../../contexts/LanguageContext'

const FloatingLinks: React.FC = () => {
    const { language } = useLanguage()



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
        '&:focus': {
            outline: 'none',
        },
        '&:focus-visible': {
            outline: 'none',
        },
        WebkitTapHighlightColor: 'transparent',
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
                    href={language === 'es' ? '/en' : '/'}
                    sx={{
                        ...buttonStyles,
                        '&:hover .icon': {
                            color: '#eab308',
                        },
                    }}
                    aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                    <Languages className="icon" style={iconStyles} />
                </IconButton>
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
                    href="https://github.com/gonzagramaglia/entrenar"
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

