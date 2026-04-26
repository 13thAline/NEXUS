// src/app/api/staff/roster/route.ts
// GET — Returns mock staff roster data
// In production, this would integrate with the hotel's HR/scheduling system

import { NextResponse } from 'next/server'
import staffData from '../../../../../data/staff.json'

export async function GET() {
  return NextResponse.json(staffData)
}
