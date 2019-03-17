
/**
 * Interface for twine objects loaded from JSON
 */
interface ITwison {
    name: string;
    startnode: number;
    passages: IPassage[];
}

/**
 * Interface for passages loaded from JSON
 */
interface IPassage {
    name: string;
    text: string;
    pid: number;
    links: ILink[];
}

/**
 * Interface for links loaded from JSON
 */
interface ILink {
    name: string;
    link: string;
    pid: number;
}

export class Twison {
    public name: string;
    public startnode: number;
    public passages: Passage[];

    constructor(name: string, startnode: number) {
        this.name = name;
        this.startnode = startnode;
        this.passages = [];
    }
}

export class Passage {

    public links: Link[] = [];

    constructor(public name: string, public text: string, public pid: number) { }
}

export class Link {
    constructor(public name: string, public link: string, public target: number) { }
}

export function loadTwison(content: string): Twison {
    const raw: ITwison = JSON.parse(content);
    const twine = new Twison(raw.name, Number(raw.startnode));
    for (const p of raw.passages) {
        const ip: IPassage = p;
        const passage = new Passage(ip.name, ip.text, Number(ip.pid));
        twine.passages.push(passage);
        if (ip.links) {
            for (const l of ip.links) {
                const il: ILink = l;
                const link = new Link(il.name, il.link, Number(il.pid));
                passage.links.push(link);
            }
        }
    }
    return twine;
}
