import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'

import {
  doc,
  setDoc
} from 'firebase/firestore'

import { auth, db } from '../firebase'

export const registerUser = async (email, password) => {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )

  const user = result.user

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,

    username: user.email.split('@')[0],

    level: 1,
    xp: 0,
    xpToNext: 1000,

    coins: 0,
    fragments: 0,

    streak: 0,

    rank: 'INITIATE',
    faction: 'VOID SYNDICATE',

    completedQuests: [],

    createdAt: new Date().toISOString()
  })

  return result
}
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const logoutUser = () => {
  return signOut(auth)
}