declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        usosUserId: string;
        displayName: string;
      } | null;
    }
  }
}

export {};
