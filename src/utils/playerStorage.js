import { PLAYER } from '../data/mockData'

export function getPlayerData() {
  const saved = localStorage.getItem('algorealm_player')

  if (saved) {
    return JSON.parse(saved)
  }

  localStorage.setItem('algorealm_player', JSON.stringify(PLAYER))

  return PLAYER
}

export function savePlayerData(data) {
  localStorage.setItem('algorealm_player', JSON.stringify(data))
}