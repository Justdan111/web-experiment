export type Step = 0 | 1 | 2 | 3 | 4;

export type BookingState = {
  step: Step;
  courtId: number | null;
  date: string | null;
  hour: number | null;
  name: string;
  email: string;
  phone: string;
  reference: string | null;
};

export type BookingAction =
  | { type: "SELECT_COURT"; courtId: number }
  | { type: "SELECT_DATE"; date: string }
  | { type: "SELECT_HOUR"; hour: number }
  | { type: "SET_FIELD"; field: "name" | "email" | "phone"; value: string }
  | { type: "BACK" }
  | { type: "CONFIRM"; reference: string }
  | { type: "RESET" };

export const initialBooking: BookingState = {
  step: 0,
  courtId: null,
  date: null,
  hour: null,
  name: "",
  email: "",
  phone: "",
  reference: null,
};

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "SELECT_COURT":
      // a slot is only meaningful for one court, so changing court drops it
      return { ...state, courtId: action.courtId, hour: null, step: 1 };
    case "SELECT_DATE":
      return { ...state, date: action.date, hour: null, step: 2 };
    case "SELECT_HOUR":
      return { ...state, hour: action.hour, step: 3 };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "BACK":
      // Confirmation is terminal; cannot go back from step 4
      if (state.step === 4) return state;
      return { ...state, step: Math.max(0, state.step - 1) as Step };
    case "CONFIRM":
      return { ...state, reference: action.reference, step: 4 };
    case "RESET":
      return initialBooking;
    default:
      return state;
  }
}

/** Where the flow should sit given what has actually been chosen. */
export function firstIncompleteStep(state: BookingState): Step {
  if (state.reference !== null) return 4;
  if (state.courtId === null) return 0;
  if (state.date === null) return 1;
  if (state.hour === null) return 2;
  return 3;
}

export const isName = (v: string): boolean => v.trim().length >= 2;

export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isPhone = (v: string): boolean =>
  /^[+\d][\d\s-]{6,}$/.test(v.trim());

export const detailsValid = (s: BookingState): boolean =>
  isName(s.name) && isEmail(s.email) && isPhone(s.phone);
