import { User } from "./lib/manifold/common/src/user";

// Given an object out of window.pState, we'll return HTML that represents the current state of the object to go in the card.
export function userToCard(user: User): string {
    return `
        <div class="card user-card">
            <div class="card-label">USER</div>
            <div class="card-body">
                <h5 class="card-title">${user.id}</h5>
                <h6 class="card-subtitle">${user.balance}M</h6>
            </div>
        </div>
    `;
}