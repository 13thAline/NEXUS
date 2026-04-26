// src/app/api/pms/occupancy/route.ts
// GET — Returns mock PMS (Property Management System) occupancy data
// In production, this would integrate with real PMS like Opera/FIDELIO

import { NextResponse } from 'next/server'
import occupancyData from '../../../../../data/occupancy.json'

export async function GET() {
  // Simulate a slight delay as if querying a real PMS
  return NextResponse.json(occupancyData)
}
