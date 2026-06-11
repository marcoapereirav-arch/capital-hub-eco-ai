"use server"

import { revalidatePath } from "next/cache"
import {
  assertAdmin,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./contenido-service"

export async function actionCreateModule(formationId: number, name: string) {
  await assertAdmin()
  await createModule(formationId, name)
  revalidatePath("/contenido")
}

export async function actionUpdateModule(id: number, name: string, description: string | null) {
  await assertAdmin()
  await updateModule(id, { name: name.trim(), description: description?.trim() || null })
  revalidatePath("/contenido")
}

export async function actionDeleteModule(id: number) {
  await assertAdmin()
  await deleteModule(id)
  revalidatePath("/contenido")
}

export async function actionCreateLesson(moduleId: number, title: string) {
  await assertAdmin()
  await createLesson(moduleId, title)
  revalidatePath("/contenido")
}

export async function actionUpdateLesson(
  id: number,
  updates: { title?: string; content?: string | null; video_url?: string | null; bunny_video_id?: string | null },
) {
  await assertAdmin()
  await updateLesson(id, updates)
  revalidatePath("/contenido")
}

export async function actionDeleteLesson(id: number) {
  await assertAdmin()
  await deleteLesson(id)
  revalidatePath("/contenido")
}
