import { User } from "./lib/manifold/common/src/user";


function round(num: number): number {
    return Math.round(num * 1000) / 1000;
}

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

export function contractToCard(c: any): string {
    return `
        <div class="card contract-card">
            <div class="card-label">${c.outcomeType} CONTRACT</div>
            <div class="card-body">
                <h5 class="card-title">${c.id}</h5>
                <h6 class="card-subtitle">${round(c.p)}M</h6>
                <table class="table">
                    <tbody>
                        <tr>
                            <td>YES pool</td>
                            <td>${round(c.pool.YES)}</td>
                        </tr>
                        <tr>
                            <td>NO pool</td>
                            <td>${round(c.pool.NO)}</td>
                        </tr>
                    </tbody>
            </div>
        </div>
    `;
}